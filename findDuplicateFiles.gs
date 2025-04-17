function findDuplicateFiles(folder) {
  const files = folder.getFiles();
  const seen = {};
  const duplicates = [];
  while (files.hasNext()) {
    const file = files.next();
    const key = `${file.getName()}_${file.getSize()}`;
    if (seen[key]) {
      duplicates.push({
        name: file.getName(),
        size: file.getSize(),
        id: file.getId()
      });
    } else {
      seen[key] = true;
    }
  }
  return duplicates;
}

function getFileHash(fileId) {
  const accessToken = ScriptApp.getOAuthToken();
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      Range: 'bytes=0-5242879'  // 1MB
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 206 && response.getResponseCode() !== 200) {
    Logger.log('בעיה בהורדת חלק מהקובץ: ' + response.getContentText());
    return null;
  }

  const partialBytes = response.getContent();
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, partialBytes);
  const hash = digest.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
  return hash;
}

// old
function hashFile(file) {
  try {
    const blob = file.getBlob();
    const data = blob.getDataAsString().slice(0, 500000);
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data);
    return digest.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
  } catch (e) {
    return null;
  }
}

function findDuplicateFilesByHash(folder) {
  const files = folder.getFiles();
  const seen = {};
  const duplicates = [];
  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();
    const hash = getFileHash(fileId);
    if (!hash) continue;
    if (seen[hash]) {
      duplicates.push({
        name: file.getName(),
        size: file.getSize(),
        hash,
        id: file.getId()
      });
    } else {
      seen[hash] = true;
    }
  }
  return duplicates;
}

function handleFindDuplicates(e) {
  const folderId = e.parameters.folderId;
  
  const notification = CardService.newNotification()
    .setText("מחפש קבצים כפולים, זה עשוי לקחת זמן...");
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const duplicates = findDuplicateFilesByHash(folder);

    if (duplicates.length === 0) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText("לא נמצאו קבצים כפולים בתיקייה זו"))
        .setNavigation(CardService.newNavigation().updateCard(
          buildInfoCard("לא נמצאו קבצים כפולים בתיקייה זו.")
        ))
        .build();
    }

    const section = CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText("📑 נמצאו קבצים כפולים (תוכן זהה):"));

    duplicates.forEach(d => {
      section.addWidget(CardService.newTextParagraph()
        .setText(`🔁 <b>${d.name}</b> – ${formatFileSize(d.size)}`));
    });
    
    const backButton = CardService.newTextButton()
      .setText("חזרה לפרטי תיקייה")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("analyzeFolderCard")
        .setParameters({ folderId }));
    
    section.addWidget(backButton);

    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("קבצים כפולים"))
      .addSection(section)
      .build();

  } catch (err) {
    return buildErrorCard("שגיאה בעת חיפוש כפולים: " + err.message);
  }
}
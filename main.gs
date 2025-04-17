/**
 * D3 Analyzer Add-on
 * תוסף לגוגל דרייב להצגת מידע על תיקיות וקבצים
 */


function onHomepage(e) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("ברוך הבא"))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText("אנא סמן תיקייה ב-Drive והפעל את התוסף לקבלת מידע.")))
    .build();
}

function onDriveItemsSelected(e) {
  const selectedItems = e.drive ? e.drive.selectedItems : null;
  const activeFolderId = e.drive ? e.drive.activeFolderId : null;

  
  if (!selectedItems || selectedItems.length === 0) {
    try {
      if (activeFolderId) {
        return analyzeFolderCard(activeFolderId);
      } else {
        const rootFolder = DriveApp.getRootFolder();
        return analyzeFolderCard(rootFolder.getId(), true);
      }
    } catch (err) {
      const rootFolder = DriveApp.getRootFolder();
      return analyzeFolderCard(rootFolder.getId(), true);
    }
  }

  const folderItem = selectedItems.find(item => item.mimeType === MimeType.FOLDER);
  
  if (!folderItem) {
    const fileItem = selectedItems[0];
    if (fileItem) {
      const loadingCard = createLoadingCard("טוען נתוני קובץ...");
      
      try {
        return analyzeFileCard(fileItem.id);
      } catch (err) {
        return buildErrorCard("שגיאה: " + err.message);
      }
    } else {
      if (selectedItems[0] && selectedItems[0].parents && selectedItems[0].parents.length > 0) {
        return analyzeFolderCard(selectedItems[0].parents[0]);
      } else {
        const rootFolder = DriveApp.getRootFolder();
        return analyzeFolderCard(rootFolder.getId(), true);
      }
    }
  }

  const loadingCard = createLoadingCard("טוען נתוני תיקייה...");
  
  try {
    return analyzeFolderCard(folderItem.id);
  } catch (err) {
    return buildErrorCard("שגיאה: " + err.message);
  }
}


function continueProcessing(e) {
  try {
    const selectedItems = JSON.parse(e.parameters.selectedItems || '[]');
    const activeFolderId = e.parameters.activeFolderId;
    
    if (!selectedItems || selectedItems.length === 0) {
      try {
        if (activeFolderId) {
          return analyzeFolderCard(activeFolderId);
        } else {
          const rootFolder = DriveApp.getRootFolder();
          return analyzeFolderCard(rootFolder.getId(), true);
        }
      } catch (err) {
        const rootFolder = DriveApp.getRootFolder();
        return analyzeFolderCard(rootFolder.getId(), true);
      }
    }

    const folderItem = selectedItems.find(item => item.mimeType === MimeType.FOLDER);
    
    if (!folderItem) {
      const fileItem = selectedItems[0];
      if (fileItem) {
        return analyzeFileCard(fileItem.id);
      } else {
        if (selectedItems[0] && selectedItems[0].parents && selectedItems[0].parents.length > 0) {
          return analyzeFolderCard(selectedItems[0].parents[0]);
        } else {
          const rootFolder = DriveApp.getRootFolder();
          return analyzeFolderCard(rootFolder.getId(), true);
        }
      }
    }

    return analyzeFolderCard(folderItem.id);
    
  } catch (err) {
    return buildErrorCard("שגיאה בעיבוד: " + err.message);
  }
}


function analyzeFileCard(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const name = file.getName();
    const size = file.getSize();
    const lastModified = file.getLastUpdated();
    const mimeType = file.getMimeType();
    const owners = file.getOwner() ? file.getOwner().getEmail() : "לא זמין";
    const dateCreated = file.getDateCreated();
    const url = file.getUrl();
    
    const formattedSize = formatFileSize(size);
    const lastModStr = lastModified ? 
      Utilities.formatDate(lastModified, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") : 
      "לא זמין";
    const createdStr = dateCreated ? 
      Utilities.formatDate(dateCreated, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") : 
      "לא זמין";
      
    let parentFolder = "לא זמין";
    const parents = file.getParents();
    if (parents.hasNext()) {
      parentFolder = parents.next().getName();
    }

    const section = CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(
        `📄 <b>${name}</b><br>` +
        `💾 גודל הקובץ: <b>${formattedSize}</b><br>` +
        `🕒 שינוי אחרון: <b>${lastModStr}</b><br>` +
        `📅 נוצר בתאריך: <b>${createdStr}</b><br>` +
        `📂 תיקיית הורה: <b>${parentFolder}</b><br>` +
        `👤 בעלים: <b>${owners}</b><br>` +
        `🔣 סוג קובץ: <b>${mimeType}</b><br>`
      ));
      
    const openButton = CardService.newTextButton()
      .setText("🔍 פתח את הקובץ")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOpenLink(CardService.newOpenLink()
        .setUrl(url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE));
        
    section.addWidget(openButton);
    
    if (parents.hasNext()) {
      const parentId = parents.next().getId();
      const duplicateButton = CardService.newTextButton()
        .setText("🔍 בדוק קבצים כפולים בתיקייה")
        .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
        .setOnClickAction(CardService.newAction()
          .setFunctionName("handleFindDuplicates")
          .setParameters({ folderId: parentId }));
          
      section.addWidget(duplicateButton);
    }
      
    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("פרטי קובץ"))
      .addSection(section)
      .build();
  } catch (err) {
    return buildErrorCard("שגיאה: " + err.message);
  }
}


function analyzeFolderCard(folderId, isRoot = false) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const name = isRoot ? "My Drive (תיקיית העל)" : folder.getName();
    const folders = folder.getFolders();
    
    const stats = calculateFolderSize(folder);
    const fileCount = stats.files;
    const totalSize = stats.size;
    const lastModified = stats.lastModified;
    
    let folderCount = 0;
    while (folders.hasNext()) {
      folders.next();
      folderCount++;
    }

    const formattedSize = formatFileSize(totalSize);
    const lastModStr = lastModified
      ? Utilities.formatDate(lastModified, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")
      : "לא זמין";

    const section = CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(
        `📁 <b>${name}</b><br>` +
        `📄 קבצים: <b>${fileCount}</b><br>` +
        `📂 תיקיות משנה: <b>${folderCount}</b><br>` +
        `💾 גודל כולל: <b>${formattedSize}</b><br>` +
        `🕒 שינוי אחרון: <b>${lastModStr}</b>`
      ));

    const duplicateButton = CardService.newTextButton()
      .setText("🔍 מצא קבצים כפולים")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("handleFindDuplicates")
        .setParameters({ folderId }));

    section.addWidget(duplicateButton);
    
    const extensionsButton = CardService.newTextButton()
      .setText("📊 פילוח סוגי קבצים")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("handleShowFileExtensions")
        .setParameters({ folderId }));
    
    section.addWidget(extensionsButton);
    
    const treeButton = CardService.newTextButton()
      .setText("🌳 הצג מבנה תיקיות")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("handleShowFolderTree")
        .setParameters({ folderId }));
    
    section.addWidget(treeButton);

    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("פרטי תיקייה"))
      .addSection(section)
      .build();

  } catch (err) {
    return buildErrorCard("שגיאה: " + err.message);
  }
}


function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + units[i];
}

function createLoadingCard(message) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("מעבד מידע"))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText("⏳ " + message))
    )
    .build();
}

function buildErrorCard(message) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("שגיאה"))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText("❗ " + message))
    )
    .build();
}

function buildInfoCard(message) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("מידע"))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText(message))
    )
    .build();
}


function handleShowFileExtensions(e) {
  const folderId = e.parameters.folderId;
  
  const notification = CardService.newNotification()
    .setText("מנתח סוגי קבצים, אנא המתן...");
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const extensions = analyzeFileExtensions(folder);
    
    const sortedExtensions = Object.entries(extensions)
      .sort((a, b) => b[1].count - a[1].count);
    
    const section = CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText("📊 סיכום סוגי קבצים:"));
    
    sortedExtensions.forEach(([ext, data]) => {
      section.addWidget(CardService.newTextParagraph()
        .setText(`🔹 <b>${ext}</b>: ${data.count} קבצים (${formatFileSize(data.size)})`));
    });
    
    const backButton = CardService.newTextButton()
      .setText("חזרה לפרטי תיקייה")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("analyzeFolderCard")
        .setParameters({ folderId: folderId }));
    
    section.addWidget(backButton);
    
    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle(`פילוח סוגי קבצים - ${folder.getName()}`))
      .addSection(section)
      .build();
    
  } catch (err) {
    return buildErrorCard("שגיאה בניתוח סיומות קבצים: " + err.message);
  }
}


function handleShowFolderTree(e) {
  const folderId = e.parameters.folderId;
  
  const notification = CardService.newNotification()
    .setText("בונה מבנה תיקיות, אנא המתן...");
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const tree = buildFolderTree(folder);
    const treeText = renderFolderTree(tree);
    
    const section = CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText(treeText));
    
    const backButton = CardService.newTextButton()
      .setText("חזרה לפרטי תיקייה")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("analyzeFolderCard")
        .setParameters({ folderId: folderId }));
    
    section.addWidget(backButton);
    
    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle(`מבנה תיקיות - ${folder.getName()}`))
      .addSection(section)
      .build();
    
  } catch (err) {
    return buildErrorCard("שגיאה בבניית עץ תיקיות: " + err.message);
  }
}

function calculateFolderSize(folder, stats = { size: 0, files: 0, lastModified: null }) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    stats.files++;
    stats.size += file.getSize();
    
    const updated = file.getLastUpdated();
    if (!stats.lastModified || updated > stats.lastModified) {
      stats.lastModified = updated;
    }
  }
  
  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    const subFolder = subFolders.next();
    calculateFolderSize(subFolder, stats);
  }
  
  return stats;
}

function analyzeFileExtensions(folder, recursive = true) {
  const extensions = {};
  const processFiles = (currentFolder) => {
    const files = currentFolder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();
      const fileSize = file.getSize();
      
      let extension = "ללא סיומת";
      if (fileName.lastIndexOf('.') !== -1) {
        extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
      }
      
      if (!extensions[extension]) {
        extensions[extension] = { count: 0, size: 0 };
      }
      extensions[extension].count++;
      extensions[extension].size += fileSize;
    }
    
    if (recursive) {
      const subFolders = currentFolder.getFolders();
      while (subFolders.hasNext()) {
        processFiles(subFolders.next());
      }
    }
  };
  
  processFiles(folder);
  return extensions;
}

function buildFolderTree(folder, maxDepth = 10, currentDepth = 0) {
  const tree = {
    name: folder.getName(),
    id: folder.getId(),
    fileCount: 0,
    size: 0,
    children: []
  };
  
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    tree.fileCount++;
    tree.size += file.getSize();
  }
  
  if (currentDepth < maxDepth) {
    const subFolders = folder.getFolders();
    while (subFolders.hasNext()) {
      const subFolder = subFolders.next();
      const subTree = buildFolderTree(subFolder, maxDepth, currentDepth + 1);
      tree.children.push(subTree);
      
      tree.fileCount += subTree.fileCount;
      tree.size += subTree.size;
    }
  }
  
  return tree;
}

function renderFolderTree(tree, indent = "") {
  let output = `${indent}📁 <b>${tree.name}</b> (${tree.fileCount} קבצים, ${formatFileSize(tree.size)})\n`;
  
  tree.children.forEach((child, index) => {
    const isLastChild = index === tree.children.length - 1;
    const childIndent = indent + (isLastChild ? "└── " : "├── ");
    const nextIndent = indent + (isLastChild ? "    " : "│   ");
    output += renderFolderTree(child, nextIndent);
  });
  
  return output;
}
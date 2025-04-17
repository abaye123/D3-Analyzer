# D3 Analyzer - תוסף Google Drive

## תיאור

D3 Analyzer הוא תוסף Google Workspace שנועד לספק תובנות מפורטות על הקבצים והתיקיות שלך ב-Google Drive. על ידי בחירת קובץ או תיקייה, תוכל להשתמש בתוסף זה כדי:

*   **לנתח תיקיות:** הצג את מספר הקבצים ותתי-התיקיות, הגודל הכולל, ותאריך השינוי האחרון המשמעותי בתוך התיקייה.
*   **לנתח קבצים:** קבל מידע מפורט על קובץ בודד, כולל גודל, תאריכי יצירה ושינוי, סוג הקובץ (MIME type), בעלים, תיקיית הורה, וקישור ישיר לקובץ.
*   **לזהות קבצים כפולים:** סרוק תיקייה נבחרת לאיתור קבצים בעלי תוכן זהה (מבוסס hash).
*   **לפלח לפי סוג קובץ:** הצג סיכום של סוגי הקבצים השונים בתיקייה (לפי סיומת) וכמה מקום כל סוג תופס.
*   **להציג מבנה תיקיות:** קבל תצוגה היררכית (עץ) של מבנה התיקיות, כולל מספר הקבצים והגודל בכל תיקייה (עד עומק מסוים).

## תכונות עיקריות

*   ניתוח מקיף של תיקיות וקבצים.
*   חישוב רקורסיבי של גודל תיקיות גם לתיקיות משנה.
*   זיהוי קבצים כפולים באמצעות hash.
*   פילוח קבצים לפי סיומת וגודל.
*   הצגת עץ תיקיות ויזואלי.
*   ממשק משתמש אינטגרטיבי בתוך Google Drive.

## הוראות התקנה (סביבת בדיקה אישית)

כדי להתקין ולהריץ גרסת בדיקה של התוסף בחשבון Google שלך:

1.  **פתיחת פרויקט חדש ב-Apps Script:**
    *   עבור אל [script.google.com](https://script.google.com).
    *   לחץ על "New project".
    *   תן שם לפרויקט (לדוגמה: "D3 Analyzer Test").

2.  **העתקת קוד המניפסט (`appsscript.json`):**
    *   בפרויקט המקומי שלך, פתח את הקובץ `appscript.json`.
    *   העתק את כל התוכן שלו.
    *   בעורך ה-Apps Script, לחץ על סמל ההגדרות (גלגל שיניים ⚙️) בצד שמאל ובחר "Show "appsscript.json" manifest file".
    *   הדבק את התוכן שהעתקת לתוך קובץ המניפסט בעורך, תוך החלפת התוכן הקיים.

3.  **העתקת קוד הסקריפט (`.gs`):**
    *   פתח את הקבצים `main.gs` ו-`findDuplicateFiles.gs` בפרויקט המקומי שלך.
    *   בעורך ה-Apps Script, פתח את הקובץ `Code.gs` (או השם שניתן לו כברירת מחדל).
    *   מחק את התוכן הקיים ב-`Code.gs`.
    *   העתק את כל התוכן מ-`main.gs` והדבק אותו ב-`Code.gs`.
    *   העתק את כל התוכן מ-`findDuplicateFiles.gs` והדבק אותו **מתחת** לתוכן שהדבקת זה עתה ב-`Code.gs`.

4.  **שמירת הפרויקט:**
    *   לחץ על סמל השמירה (דיסקט 💾) או השתמש בקיצור Ctrl+S / Cmd+S.

5.  **הרצת פונקציה והרשאות:**
    *   בסרגל העליון, בחר את הפונקציה `onHomepage` מהרשימה הנפתחת.
    *   לחץ על כפתור "Run".
    *   תיפתח חלונית "Authorization required". לחץ על "Review permissions".
    *   בחר את חשבון Google שלך.
    *   ייתכן שתראה מסך "Google hasn’t verified this app". לחץ על "Advanced" ואז על "Go to [שם הפרויקט שלך] (unsafe)".
    *   עיין בהרשאות שהסקריפט מבקש (בעיקר גישת קריאה ל-Drive) ולחץ על "Allow".

6.  **יצירת פריסת בדיקה (Test Deployment):**
    *   לחץ על כפתור "Deploy" ובחר "New deployment".
    *   ליד "Select type", לחץ על סמל גלגל השיניים ⚙️ ובחר "Add-on".
    *   בשדה "Description", הזן תיאור (לדוגמה: "D3 Analyzer Test Deployment").
    *   תחת "Deployment configuration", ודא שהאפשרות "Install for myself only" מסומנת.
    *   לחץ על "Deploy".

7.  **סיום ההתקנה:**
    *   התוסף מותקן כעת עבור החשבון שלך.
    *   רענן את Google Drive ([drive.google.com](https://drive.google.com)).
    *   כאשר תבחר קובץ או תיקייה ב-Drive, סמל התוסף "D3 Analyzer" (![אייקון בועות](https://www.gstatic.com/images/icons/material/system/2x/bubble_chart_black_24dp.png)) יופיע בחלונית הצדדית השמאלית. לחץ עליו כדי להפעיל את התוסף.

## שימוש

1.  פתח את Google Drive.
2.  בחר קובץ או תיקייה שברצונך לנתח.
3.  פתח את חלונית הצד הימנית (אם היא לא פתוחה).
4.  לחץ על סמל התוסף "D3 Analyzer".
5.  התוסף יציג את המידע הרלוונטי ואפשרויות נוספות בהתאם לפריט שנבחר.

## הרשאות נדרשות

התוסף דורש הרשאות גישה לקריאה בלבד (read-only) ל-Google Drive שלך כדי לנתח את מבנה הקבצים והתיקיות ולקרוא מטא-דאטה. הוא אינו משנה או מוחק קבצים.

## רישיון

MIT עם חובת קרדיט

## יצירת קשר

לדיווח על באגים או הצעות, אנא פתח Issue במאגר ה-GitHub.

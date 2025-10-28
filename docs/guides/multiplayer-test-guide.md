# 🎮 GLXY GAMING - MULTIPLAYER LIVE TEST GUIDE

## 🎯 LIVE MULTIPLAYER-TEST zwischen Demo-Accounts

### ✅ VORBEREITUNG FERTIG:
- **Anwendung läuft:** http://localhost:3000 ✓
- **Datenbank:** PostgreSQL mit 14 Tabellen ✓
- **Demo-Accounts:** 4 Test-Accounts erstellt ✓
- **Socket.IO:** Real-Time-Verbindungen ✓

### 📋 TEST-ACCOUNTS:

| Username | E-Mail | Passwort | Level | XP |
|----------|--------|----------|-------|----|
| `admin` | john@doe.com | johndoe123 | 50 | 25K |
| `ChessKing` | gamer1@glxy.at | demo123 | 15 | 3.5K |
| `GameMaster` | gamer2@glxy.at | demo123 | 22 | 5.8K |
| `RookiePlayer` | gamer3@glxy.at | demo123 | 3 | 450 |

---

## 🚀 SCHRITT-FÜR-SCHRITT MULTIPLAYER-TEST:

### **SCHRITT 1: Browser-Tabs öffnen**
1. **Öffnen Sie zwei separate Browser-Tabs**
2. **Navigieren Sie zu:** `http://localhost:3000`
3. **Tab 1:** Verwenden Sie für `ChessKing` (Spieler A)
4. **Tab 2:** Verwenden Sie für `GameMaster` (Spieler B)

### **SCHRITT 2: Login durchführen**
#### **Tab 1 - ChessKing:**
```
📧 E-Mail: gamer1@glxy.at
🔑 Passwort: demo123
🎯 Klicken Sie: "Login"
```

#### **Tab 2 - GameMaster:**
```
📧 E-Mail: gamer2@glxy.at
🔑 Passwort: demo123
🎯 Klicken Sie: "Login"
```

### **SCHRITT 3: Spiel-Room erstellen**
#### **In Tab 1 (ChessKing):**
1. **Gehen Sie zu:** "Games" → "Multiplayer" → "Create Room"
2. **Konfiguration:**
   ```
   🏷️ Room Name: "Demo Chess Battle"
   ♟️ Game Type: Chess
   👥 Max Players: 2
   🌐 Public: Ja (aktivieren)
   ```
3. **Klicken Sie:** "Create Room"
4. **Warten Sie:** Room wird erstellt ✅

### **SCHRITT 4: Spieler beitritt**
#### **In Tab 2 (GameMaster):**
1. **Gehen Sie zu:** "Games" → "Multiplayer" → "Join Game"
2. **Suchen Sie:** "Demo Chess Battle"
3. **Klicken Sie:** "Join Room"

### **SCHRITT 5: Spiel starten**
#### **Automatisches Spiel-Start:**
- 🎯 **Spiel beginnt automatisch** wenn beide Spieler bereit sind
- ♟️ **ChessKing** (Schwarz/Weiß) vs **GameMaster**
- ⏱️ **Zeitlimit:** 10 Minuten pro Spieler
- 🔄 **Live-Updates:** Jedes Feld wird sofort synchronisiert

### **SCHRITT 6: Chat-Funktion testen**
```
💬 Während des Spiels können beide Spieler chatten:
- Schreiben Sie Nachrichten
- Emojis werden unterstützt
- Live-Chat wird über Socket.IO übertragen
```

---

## 🎯 ERWARTETE FUNKTIONEN:

### ✅ **Was funktionieren sollte:**
- 🔐 **Login/Logout** beider Accounts
- 👤 **Profile** mit Level/XP-Anzeige
- 🎮 **Room-Erstellung** und beitreten
- ♟️ **Live-Chess-Spiel** mit Drag & Drop
- 💬 **Real-Time Chat** zwischen Spielern
- 📊 **Stats-Tracking** nach Spielende
- 🏆 **XP und Achievements** System

### 🔄 **Real-Time Features:**
- 🎯 **Socket.IO-Verbindungen** für Live-Updates
- ⏱️ **Zeit-Tracker** für jeden Spieler
- 👁️ **Spectator-Modus** möglich
- 📡 **Verbindungsstatus** angezeigt

---

## 🐛 FALLS PROBLEME AUFTRETEN:

### **Problem: Login fehlgeschlägt**
```
✅ Lösung: Kontrollieren Sie E-Mail und Passwort
✅ Alternative: Nutzen Sie "admin" Account
```

### **Problem: Room nicht gefunden**
```
✅ Lösung: Stellen Sie sicher, dass "Public" aktiviert ist
✅ Alternative: Erstellen Sie den Room als "GameMaster"
```

### **Problem: Spiel startet nicht**
```
✅ Lösung: Beide Spieler müssen "Ready" klicken
✅ Alternative: Refresh der Browser-Tabs
```

### **Problem: Chat funktioniert nicht**
```
✅ Lösung: Überprüfen Sie Socket.IO-Verbindung
✅ Alternative: Browser-Konsole für Fehler prüfen
```

---

## 📊 **ERFOLGSKRITERIEN:**

### ✅ **Test erfolgreich wenn:**
- [ ] **Beide Accounts** erfolgreich eingeloggt
- [ ] **Room erstellt** und angezeigt
- [ ] **Zweiter Spieler** kann beitreten
- [ ] **Spiel startet** automatisch
- [ ] **Schachzüge** werden live synchronisiert
- [ ] **Chat-Nachrichten** erscheinen sofort
- [ ] **Timer** zählt korrekt herunter
- [ ] **Verbindungsstatus** zeigt "Online"

### 🎉 **GESAMT-ERFOLG: Voll funktionales Multiplayer-System!**

---

## 🚀 **NÄCHSTE SCHRITTE NACH ERFOLG:**

### **Option 1: Weitere Tests**
- 🔄 **Mehrere Runden** spielen
- 👥 **Dritten Account hinzufügen** (Spectator)
- 📊 **Performance** bei gleichzeitigen Sessions testen

### **Option 2: Production-Vorbereitung**
- 🔧 **Hetzner-Server** aufsetzen
- 📦 **Docker-Deployment** konfigurieren
- 🔒 **SSL-Zertifikat** installieren
- 🌐 **Domain glxy.at** einrichten

### **Option 3: Erweiterte Features**
- 🎯 **Tournament-System** testen
- 🏆 **Achievements** sammeln
- 👥 **Freundesliste** aufbauen
- 📈 **Leaderboards** analysieren

---

## 💬 **HILFE BEI FRAGEN:**

Bei Problemen während des Tests:
1. **🔍 Browser-Konsole** öffnen (F12)
2. **📝 Fehler-Meldungen** dokumentieren
3. **🔄 Browser-Tabs** refreshen
4. **👨‍💻 Support:** Beschreiben Sie das Problem

**Viel Erfolg beim Live-Multiplayer-Test!** ⚔️🎮

# ✅ Checklist de Lancement - Plateforme d'Enquête Patrimoine Marocain

## Utilisez cette liste pour vous assurer que tout est prêt avant le lancement

---

## 🔐 PHASE 1: SÉCURITÉ (CRITIQUE) ⚠️

### Identifiants et Secrets
- [ ] **CRITIQUE**: Mot de passe admin changé (pas admin123!)
  - Se connecter à http://localhost:3000/admin
  - Aller dans Profil > Changer mot de passe
  - Utiliser un mot de passe fort (12+ caractères)
  
- [ ] **CRITIQUE**: JWT_SECRET changé dans .env
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  - Copier le résultat dans .env → JWT_SECRET=...
  
- [ ] Email admin mis à jour
  - Changer admin@patrimoine.gov.ma vers votre email réel
  
- [ ] Nom complet admin configuré
  - Mettre votre vrai nom dans le profil

### Configuration Production
- [ ] .env configuré pour production
  ```env
  NODE_ENV=production
  CORS_ORIGIN=https://votre-domaine.gov.ma
  ```
  
- [ ] Variables sensibles protégées
  - [ ] Pas de secrets dans le code
  - [ ] .env dans .gitignore
  - [ ] Pas de credentials exposés

---

## 🧪 PHASE 2: TESTS

### Tests Système
- [ ] Exécuter le script de test
  ```bash
  node test-system.js
  ```
  - [ ] Tous les tests passent ✅
  - [ ] 7 enquêtes trouvées
  - [ ] 364 questions vérifiées
  - [ ] Base de données intègre
  
### Tests Fonctionnels
- [ ] **Test enquête complète**
  - [ ] Ouvrir http://localhost:3000
  - [ ] Sélectionner une enquête
  - [ ] Répondre à toutes les questions
  - [ ] Sauvegarder progression
  - [ ] Soumettre l'enquête
  - [ ] Voir message de remerciement
  
- [ ] **Test interface admin**
  - [ ] Se connecter à /admin
  - [ ] Voir le tableau de bord
  - [ ] Voir les enquêtes
  - [ ] Voir les réponses
  - [ ] Exporter des données
  - [ ] Générer un QR code
  
- [ ] **Test multilingue**
  - [ ] Changer langue → Français ✓
  - [ ] Changer langue → العربية ✓
  - [ ] Changer langue → English ✓
  - [ ] Vérifier affichage RTL arabe
  
- [ ] **Test responsive**
  - [ ] Desktop (1920x1080) ✓
  - [ ] Laptop (1366x768) ✓
  - [ ] Tablet (768x1024) ✓
  - [ ] Mobile (375x667) ✓

### Tests Navigateurs
- [ ] Chrome/Edge (Windows)
- [ ] Firefox
- [ ] Safari (si Mac disponible)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS si disponible)

---

## 💾 PHASE 3: DONNÉES ET SAUVEGARDES

### Vérification Données
- [ ] Base de données existe
  - [ ] Fichier: data/survey_platform.db
  - [ ] Taille: ~0.26 MB
  
- [ ] Toutes les enquêtes chargées
  - [ ] Q1_PRIMARY: 27 questions ✓
  - [ ] Q2_COLLEGE: 42 questions ✓
  - [ ] Q3_LYCEE: 51 questions ✓
  - [ ] Q4_UNIV: 61 questions ✓
  - [ ] Q5_PUBLIC: 54 questions ✓
  - [ ] Q6_MINISTRY: 56 questions ✓
  - [ ] Q7_HERITAGE_STUDENTS: 73 questions ✓

### Configuration Sauvegardes
- [ ] Dossier backups/ créé
- [ ] Script de sauvegarde testé
  ```bash
  # Linux/Mac
  ./backup.sh
  
  # Windows
  # Copier manuellement data/survey_platform.db vers backups/
  ```
- [ ] Sauvegarde manuelle créée AVANT lancement
- [ ] Sauvegarde automatique configurée (si Linux)
  ```bash
  crontab -e
  # Ajouter: 0 2 * * * /chemin/vers/backup.sh
  ```

---

## 🚀 PHASE 4: DÉPLOIEMENT (si applicable)

### Environnement Serveur
- [ ] Node.js 18+ installé
  ```bash
  node --version  # Doit être >= 18.0.0
  ```
- [ ] SQLite3 installé
  ```bash
  sqlite3 --version
  ```
- [ ] NPM dépendances installées
  ```bash
  npm install --production
  ```

### Service Configuration
- [ ] Service configuré (Windows: NSSM ou Linux: systemd)
- [ ] Service démarre au boot
- [ ] Service redémarre en cas d'erreur
- [ ] Logs configurés

### Réseau et Firewall
- [ ] Port 3000 ouvert (ou port configuré)
  ```bash
  # Windows
  netstat -an | findstr :3000
  
  # Linux
  netstat -tlnp | grep 3000
  ```
- [ ] Firewall configuré
  - [ ] Windows Firewall: Port autorisé
  - [ ] UFW/iptables: Port autorisé
  
### SSL/HTTPS (recommandé pour production)
- [ ] Certificat SSL obtenu
  - [ ] Let's Encrypt configuré OU
  - [ ] Certificat acheté installé
- [ ] Nginx configuré comme reverse proxy (optionnel)
- [ ] Redirection HTTP → HTTPS active
- [ ] Headers de sécurité configurés

---

## 📚 PHASE 5: DOCUMENTATION

### Guides Disponibles
- [ ] README.md lu et compris
- [ ] INSTALLATION.md suivi
- [ ] QUICKSTART.md testé
- [ ] USER_GUIDE.md disponible pour utilisateurs
- [ ] ADMIN_GUIDE.md disponible pour admins
- [ ] DEPLOYMENT.md consulté si déploiement
- [ ] PROJECT_COMPLETE.md lu

### Distribution Documentation
- [ ] USER_GUIDE.md imprimé ou partagé
- [ ] Liens vers les guides envoyés par email
- [ ] QR codes générés pour enquêtes
- [ ] Instructions d'accès préparées

---

## 👥 PHASE 6: FORMATION ET SUPPORT

### Formation Équipe
- [ ] **Administrateurs formés**
  - [ ] Comment se connecter
  - [ ] Comment voir les réponses
  - [ ] Comment exporter les données
  - [ ] Comment générer QR codes
  - [ ] Comment gérer les utilisateurs
  - [ ] Que faire en cas de problème
  
- [ ] **Support préparé**
  - [ ] Email de support configuré
  - [ ] Numéro de téléphone attribué
  - [ ] Heures de support définies
  - [ ] Procédures de support documentées

### Communication
- [ ] Annonce préparée
  - [ ] Email aux écoles/universités
  - [ ] Communication officielle
  - [ ] Affiches avec QR codes
  
- [ ] Contacts collectés
  - [ ] Liste directeurs d'établissements
  - [ ] Liste responsables ministère
  - [ ] Liste étudiants patrimoine

---

## 🎯 PHASE 7: LANCEMENT PROGRESSIF

### Soft Launch (1-2 semaines recommandées)
- [ ] **Groupe test défini**
  - 10-20 personnes de confiance
  - Mix: étudiants, enseignants, administrateurs
  
- [ ] **Invitations envoyées**
  - Email avec liens
  - Instructions claires
  - Date limite de test
  
- [ ] **Monitoring actif**
  - Vérifier logs quotidiennement
  - Collecter les retours
  - Noter les problèmes
  
- [ ] **Corrections effectuées**
  - Bugs critiques corrigés
  - Améliorations UX si nécessaire
  - Documentation mise à jour

### Lancement Public
- [ ] **Communication officielle**
  - [ ] Email envoyé
  - [ ] Annonce site web
  - [ ] Réseaux sociaux (si applicable)
  - [ ] Affichage physique
  
- [ ] **Toutes les enquêtes activées**
  ```
  Vérifier dans Admin > Enquêtes
  Toutes doivent être "Actif"
  ```
  
- [ ] **Monitoring renforcé**
  - Première semaine: vérification quotidienne
  - Premier mois: vérification hebdomadaire
  
- [ ] **Support actif**
  - Équipe prête à répondre
  - Email de support surveillé
  - Téléphone disponible

---

## 📊 PHASE 8: MONITORING POST-LANCEMENT

### Jour 1
- [ ] Vérifier serveur en ligne
- [ ] Vérifier logs pas d'erreur critique
- [ ] Vérifier premières réponses arrivent
- [ ] Répondre aux questions de support

### Semaine 1
- [ ] Consultation logs quotidienne
- [ ] Vérification sauvegardes
- [ ] Compilation retours utilisateurs
- [ ] Corrections bugs mineurs si nécessaire

### Mois 1
- [ ] Rapport statistiques mensuel
- [ ] Optimisation base de données
- [ ] Évaluation taux de complétion
- [ ] Planification améliorations

---

## ⚠️ LISTE PROBLÈMES COURANTS ET SOLUTIONS

### Problème: Serveur ne démarre pas
**Solutions:**
1. Vérifier port 3000 pas utilisé: `netstat -ano | findstr :3000`
2. Vérifier .env existe et est correct
3. Vérifier data/survey_platform.db existe
4. Regarder logs: `logs/error.log`

### Problème: Ne peut pas se connecter admin
**Solutions:**
1. Vérifier identifiants: admin / admin123 (par défaut)
2. Vérifier JWT_SECRET dans .env
3. Vider cache navigateur
4. Essayer navigation privée

### Problème: Enquêtes ne chargent pas
**Solutions:**
1. Vérifier enquête est "Active" dans admin
2. Vérifier base de données pas corrompue: `node test-system.js`
3. Vérifier console navigateur pour erreurs JavaScript
4. Vérifier logs serveur

### Problème: Export ne fonctionne pas
**Solutions:**
1. Vérifier dossier exports/ existe
2. Vérifier permissions écriture
3. Essayer format différent (CSV au lieu de Excel)
4. Vérifier taille données pas trop grande

### Problème: Performances lentes
**Solutions:**
1. Optimiser BDD: Admin > Maintenance > Optimiser
2. Vérifier espace disque disponible
3. Redémarrer serveur
4. Vérifier pas trop de connexions simultanées

---

## 🎉 CHECKLIST FINALE - PRÊT POUR LE LANCEMENT

Cochez TOUTES ces cases avant de lancer publiquement:

### Sécurité ⚠️
- [ ] Mot de passe admin changé
- [ ] JWT_SECRET changé
- [ ] .env configuré pour production
- [ ] HTTPS activé (fortement recommandé)

### Fonctionnel
- [ ] Tous les tests système passent
- [ ] Test complet enquête réussi
- [ ] Interface admin fonctionne
- [ ] Export données fonctionne
- [ ] Multilingue testé

### Infrastructure
- [ ] Serveur en ligne et stable
- [ ] Sauvegardes configurées
- [ ] Monitoring en place
- [ ] Firewall configuré

### Documentation
- [ ] Guides disponibles et distribués
- [ ] Formation équipe terminée
- [ ] Support préparé

### Communication
- [ ] Annonce prête
- [ ] Contacts préparés
- [ ] QR codes générés

---

## ✅ VOUS ÊTES PRÊT SI...

- ✅ Toutes les cases critiques (⚠️) sont cochées
- ✅ Au moins 80% des autres cases sont cochées
- ✅ Vous avez testé le système de bout en bout
- ✅ L'équipe est formée et prête
- ✅ Le support est en place

---

## 🚀 LANCEZ!

Une fois toutes les vérifications faites:

1. **Annoncez officiellement**
2. **Distribuez les liens et QR codes**
3. **Activez le support**
4. **Surveillez de près les premiers jours**

**Bon lancement! 🎉**

---

**Date**: _______________
**Responsable**: _______________
**Signature**: _______________

Direction du Patrimoine
Ministère de la Jeunesse, de la Culture et de la Communication
Royaume du Maroc

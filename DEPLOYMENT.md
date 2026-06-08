# Guide de Déploiement - Plateforme d'Enquête sur le Patrimoine Marocain

## Phase 5: Déploiement en Production

### Pré-Déploiement

#### 1. Sécurité - Actions Critiques ⚠️

**AVANT TOUT DÉPLOIEMENT, VOUS DEVEZ:**

```bash
# 1. Changer le mot de passe admin par défaut
# Connectez-vous à http://localhost:3000/admin
# Username: admin
# Password: admin123 (CHANGEZ-LE IMMÉDIATEMENT!)

# 2. Générer de nouveaux secrets pour la production
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Mettez à jour .env avec les nouvelles valeurs:**

```env
# Sécurité
JWT_SECRET=<nouveau_secret_généré>
JWT_EXPIRES_IN=24h

# Base de données
DATABASE_PATH=./data/survey_platform.db

# Serveur
PORT=3000
NODE_ENV=production

# CORS (domaine de production)
CORS_ORIGIN=https://votre-domaine.gov.ma

# Limites
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_SURVEY_RESPONSE_SIZE=10mb

# Logs
LOG_LEVEL=info
LOG_FILE_PATH=./logs/
```

#### 2. Vérification du Système

```bash
# Exécuter les tests
node test-system.js

# Vérifier qu'il n'y a pas d'erreurs
npm audit
npm audit fix
```

#### 3. Préparation de la Base de Données

```bash
# Créer une sauvegarde
node -e "
const fs = require('fs');
const date = new Date().toISOString().split('T')[0];
fs.copyFileSync('./data/survey_platform.db', \`./backups/backup_\${date}.db\`);
console.log('Sauvegarde créée');
"

# Optimiser la base de données
sqlite3 data/survey_platform.db "VACUUM; ANALYZE;"
```

---

### Options de Déploiement

## Option A: Serveur Local/Intranet

### Configuration Requise
- **OS**: Windows Server 2016+ ou Linux (Ubuntu 20.04+)
- **RAM**: Minimum 2 GB (4 GB recommandé)
- **CPU**: 2 cœurs minimum
- **Disque**: 10 GB d'espace libre
- **Node.js**: Version 18+ LTS
- **SQLite**: Version 3.35+

### Installation sur Windows Server

```powershell
# 1. Installer Node.js
# Télécharger depuis https://nodejs.org (version LTS)

# 2. Copier les fichiers du projet
# Copiez tout le dossier vers C:\AppData\SurveyPlatform\

# 3. Installer les dépendances
cd C:\AppData\SurveyPlatform
npm install --production

# 4. Configurer les permissions
# Assurez-vous que le compte de service a accès au dossier

# 5. Créer un service Windows avec NSSM
# Télécharger NSSM: https://nssm.cc/download

nssm install SurveyPlatform "C:\Program Files\nodejs\node.exe"
nssm set SurveyPlatform AppDirectory "C:\AppData\SurveyPlatform"
nssm set SurveyPlatform AppParameters "backend\server.js"
nssm set SurveyPlatform DisplayName "Moroccan Heritage Survey Platform"
nssm set SurveyPlatform Description "Academic survey data collection platform"
nssm set SurveyPlatform Start SERVICE_AUTO_START

# 6. Démarrer le service
nssm start SurveyPlatform

# 7. Vérifier le statut
nssm status SurveyPlatform
```

### Installation sur Linux (Ubuntu/Debian)

```bash
# 1. Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# 2. Installer Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Installer SQLite
sudo apt install -y sqlite3

# 4. Créer utilisateur système
sudo useradd -r -s /bin/false surveyapp

# 5. Créer les répertoires
sudo mkdir -p /opt/survey-platform
sudo chown surveyapp:surveyapp /opt/survey-platform

# 6. Copier les fichiers
sudo cp -r /chemin/vers/projet/* /opt/survey-platform/
sudo chown -R surveyapp:surveyapp /opt/survey-platform

# 7. Installer les dépendances
cd /opt/survey-platform
sudo -u surveyapp npm install --production

# 8. Créer le service systemd
sudo nano /etc/systemd/system/survey-platform.service
```

**Contenu de survey-platform.service:**

```ini
[Unit]
Description=Moroccan Heritage Survey Platform
After=network.target

[Service]
Type=simple
User=surveyapp
WorkingDirectory=/opt/survey-platform
Environment=NODE_ENV=production
ExecStart=/usr/bin/node backend/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=survey-platform

[Install]
WantedBy=multi-user.target
```

```bash
# 9. Activer et démarrer le service
sudo systemctl enable survey-platform
sudo systemctl start survey-platform
sudo systemctl status survey-platform

# 10. Vérifier les logs
sudo journalctl -u survey-platform -f
```

### Configuration du Pare-feu

**Windows:**
```powershell
# Autoriser le port 3000
New-NetFirewallRule -DisplayName "Survey Platform" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Linux:**
```bash
# Autoriser le port 3000
sudo ufw allow 3000/tcp
sudo ufw enable
```

---

## Option B: Déploiement Cloud (Nginx Reverse Proxy)

### 1. Installer Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# Configuration Nginx
sudo nano /etc/nginx/sites-available/survey-platform
```

**Contenu de la configuration Nginx:**

```nginx
server {
    listen 80;
    server_name patrimoine-survey.gov.ma;

    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name patrimoine-survey.gov.ma;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/patrimoine-survey.gov.ma/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/patrimoine-survey.gov.ma/privkey.pem;

    # Paramètres SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Taille maximale des uploads
    client_max_body_size 10M;

    # Proxy vers Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache des fichiers statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Activer la configuration
sudo ln -s /etc/nginx/sites-available/survey-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Obtenir un Certificat SSL (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d patrimoine-survey.gov.ma

# Le renouvellement automatique est configuré par défaut
# Tester le renouvellement
sudo certbot renew --dry-run
```

---

## Sauvegardes Automatiques

### Script de Sauvegarde Quotidienne

```bash
# Créer le script
sudo nano /opt/survey-platform/backup.sh
```

**Contenu de backup.sh:**

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/survey-platform/backups"
DB_PATH="/opt/survey-platform/data/survey_platform.db"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarder la base de données
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/survey_backup_$DATE.db'"

# Compresser
gzip "$BACKUP_DIR/survey_backup_$DATE.db"

# Supprimer les anciennes sauvegardes
find $BACKUP_DIR -name "survey_backup_*.db.gz" -mtime +$RETENTION_DAYS -delete

echo "Sauvegarde créée: survey_backup_$DATE.db.gz"
```

```bash
# Rendre le script exécutable
sudo chmod +x /opt/survey-platform/backup.sh

# Ajouter au cron (tous les jours à 2h du matin)
sudo crontab -e

# Ajouter cette ligne:
0 2 * * * /opt/survey-platform/backup.sh >> /var/log/survey-backup.log 2>&1
```

---

## Surveillance et Monitoring

### 1. Surveiller les Logs

```bash
# En temps réel
tail -f /opt/survey-platform/logs/access.log
tail -f /opt/survey-platform/logs/error.log

# Avec systemd
sudo journalctl -u survey-platform -f
```

### 2. Surveiller les Performances

```bash
# Utilisation du serveur
htop

# Espace disque
df -h

# Taille de la base de données
du -h /opt/survey-platform/data/survey_platform.db
```

### 3. Endpoint de Santé

```bash
# Vérifier que le serveur répond
curl http://localhost:3000/health

# Devrait retourner:
# {"success":true,"status":"healthy",...}
```

---

## Mise à Jour du Système

```bash
# 1. Arrêter le service
sudo systemctl stop survey-platform

# 2. Sauvegarder les données
cp -r /opt/survey-platform/data /opt/survey-platform/data.backup

# 3. Mettre à jour les fichiers
# Copiez les nouveaux fichiers

# 4. Installer les dépendances
cd /opt/survey-platform
npm install --production

# 5. Redémarrer
sudo systemctl start survey-platform
sudo systemctl status survey-platform
```

---

## Dépannage

### Le serveur ne démarre pas
```bash
# Vérifier les logs
sudo journalctl -u survey-platform -n 50

# Vérifier les permissions
ls -la /opt/survey-platform/data/

# Vérifier le port
sudo netstat -tlnp | grep 3000
```

### Problèmes de performance
```bash
# Optimiser la base de données
sqlite3 /opt/survey-platform/data/survey_platform.db "VACUUM; ANALYZE;"

# Vérifier l'utilisation mémoire
free -h

# Redémarrer le service
sudo systemctl restart survey-platform
```

### Base de données corrompue
```bash
# Vérifier l'intégrité
sqlite3 /opt/survey-platform/data/survey_platform.db "PRAGMA integrity_check;"

# Restaurer depuis une sauvegarde
sudo systemctl stop survey-platform
cp /opt/survey-platform/backups/survey_backup_YYYYMMDD.db /opt/survey-platform/data/survey_platform.db
sudo systemctl start survey-platform
```

---

## Checklist de Déploiement

- [ ] Mot de passe admin changé
- [ ] JWT_SECRET généré et changé
- [ ] Variables d'environnement de production configurées
- [ ] Base de données sauvegardée
- [ ] Tests système exécutés avec succès
- [ ] Service installé et configuré
- [ ] Pare-feu configuré
- [ ] SSL/HTTPS configuré (si applicable)
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring mis en place
- [ ] Documentation accessible aux administrateurs
- [ ] Support technique prêt

---

## Support Post-Déploiement

**Contact Technique:**
- Email: tech-support@patrimoine.gov.ma
- Téléphone: +212 XXX XXX XXX
- Heures: 24/7 pour les problèmes critiques

**Maintenance Régulière:**
- Sauvegardes quotidiennes vérifiées
- Logs examinés hebdomadairement
- Mises à jour de sécurité appliquées mensuellement
- Tests de restauration trimestriels

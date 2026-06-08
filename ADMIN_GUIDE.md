# Guide d'Administration - Plateforme d'Enquête sur le Patrimoine Marocain

## Pour les Administrateurs

### 1. Accéder au Panneau d'Administration

#### Connexion
1. Ouvrez votre navigateur
2. Allez sur: `http://localhost:3000/admin` (ou votre domaine)
3. Entrez vos identifiants:
   - **Nom d'utilisateur**: admin
   - **Mot de passe**: admin123 (⚠️ CHANGEZ-LE IMMÉDIATEMENT!)

#### Premier Connexion - Actions Obligatoires
1. Changez votre mot de passe
2. Mettez à jour votre email
3. Configurez votre nom complet

---

### 2. Tableau de Bord

Le tableau de bord affiche:
- **Statistiques globales**: Nombre total de réponses, taux de complétion
- **Enquêtes actives**: Liste des questionnaires en cours
- **Activité récente**: Dernières soumissions
- **Graphiques**: Visualisation des données

---

### 3. Gestion des Enquêtes

#### Voir Toutes les Enquêtes
1. Cliquez sur "Enquêtes" dans le menu
2. Vous verrez la liste de toutes les enquêtes avec:
   - Code de l'enquête
   - Titre
   - Statut (Actif/Inactif)
   - Nombre de réponses
   - Taux de complétion

#### Activer/Désactiver une Enquête
1. Trouvez l'enquête dans la liste
2. Cliquez sur le bouton **Actif/Inactif**
3. Confirmez l'action
   - **Actif**: Les participants peuvent répondre
   - **Inactif**: Personne ne peut plus répondre

#### Voir les Détails d'une Enquête
1. Cliquez sur le titre de l'enquête
2. Vous verrez:
   - Informations générales
   - Nombre de sections et questions
   - Statistiques détaillées
   - Liste des répondants
   - Graphiques de réponses

---

### 4. Visualisation des Données

#### Voir les Réponses
1. Allez dans "Enquêtes"
2. Cliquez sur l'enquête souhaitée
3. Cliquez sur "Voir les réponses"
4. Vous pouvez:
   - Filtrer par date
   - Filtrer par statut (complètes/incomplètes)
   - Rechercher un répondant spécifique

#### Analyser les Données
1. Cliquez sur "Analytics" dans le menu
2. Sélectionnez l'enquête
3. Choisissez le type d'analyse:
   - **Résumé**: Vue d'ensemble
   - **Par question**: Analyse détaillée de chaque question
   - **Démographique**: Analyse par profil
   - **Tendances**: Évolution dans le temps

#### Types de Graphiques Disponibles
- **Choix unique**: Graphique en camembert
- **Choix multiples**: Graphique en barres
- **Échelle Likert**: Graphique en barres horizontales
- **Texte**: Nuage de mots ou liste

---

### 5. Exportation des Données

#### Exporter les Réponses

**Format Excel (.xlsx)**
1. Allez dans "Export"
2. Sélectionnez l'enquête
3. Choisissez "Excel"
4. Options:
   - Inclure les réponses complètes uniquement
   - Inclure les réponses incomplètes
   - Inclure les métadonnées (date, durée, etc.)
5. Cliquez sur "Télécharger"

**Format CSV**
1. Même procédure que Excel
2. Choisissez "CSV"
3. UTF-8 recommandé pour les caractères arabes

**Format JSON**
1. Pour un traitement technique
2. Choisissez "JSON"
3. Données structurées pour l'analyse programmée

#### Structure des Exports

**Excel/CSV:**
- Colonne 1: ID du répondant
- Colonne 2: Date de début
- Colonne 3: Date de complétion
- Colonne 4: Durée (secondes)
- Colonnes suivantes: Une par question

**JSON:**
```json
{
  "survey_code": "Q1_PRIMARY",
  "export_date": "2024-01-15T10:30:00Z",
  "total_responses": 150,
  "responses": [
    {
      "respondent_id": 1,
      "started_at": "2024-01-10T09:00:00Z",
      "completed_at": "2024-01-10T09:15:00Z",
      "answers": [...]
    }
  ]
}
```

---

### 6. Gestion des Utilisateurs Admin

#### Ajouter un Nouvel Administrateur
1. Allez dans "Utilisateurs"
2. Cliquez sur "Ajouter un administrateur"
3. Remplissez le formulaire:
   - Nom d'utilisateur (unique)
   - Email
   - Nom complet
   - Mot de passe temporaire
4. Sélectionnez le rôle:
   - **Super Admin**: Accès total
   - **Admin**: Gestion des enquêtes et visualisation
   - **Analyste**: Visualisation et export uniquement
5. Cliquez sur "Créer"

#### Modifier un Administrateur
1. Cliquez sur l'administrateur dans la liste
2. Modifiez les informations
3. Sauvegardez

#### Désactiver un Administrateur
1. Trouvez l'administrateur
2. Cliquez sur "Désactiver"
3. Le compte est bloqué mais les données sont conservées

#### Supprimer un Administrateur
1. Désactivez d'abord le compte
2. Attendez 30 jours (période de sécurité)
3. Supprimez définitivement
4. ⚠️ Action irréversible

---

### 7. Générer des Codes QR

#### Pour Faciliter l'Accès aux Enquêtes

1. Allez dans "Enquêtes"
2. Cliquez sur l'enquête souhaitée
3. Cliquez sur "Générer QR Code"
4. Options:
   - Taille: Petit (300x300), Moyen (500x500), Grand (1000x1000)
   - Inclure le logo du ministère
   - Inclure le titre de l'enquête
5. Téléchargez l'image PNG
6. Imprimez et distribuez

**Utilisation:**
- Affichage dans les écoles/universités
- Distribution sur papier
- Affichage sur écrans
- Inclusion dans des présentations

---

### 8. Rapports et Statistiques

#### Générer un Rapport

1. Allez dans "Rapports"
2. Choisissez le type:
   - **Rapport d'activité**: Vue d'ensemble de toutes les enquêtes
   - **Rapport par enquête**: Focus sur une enquête spécifique
   - **Rapport démographique**: Analyse des profils
   - **Rapport temporel**: Évolution dans le temps

3. Sélectionnez la période:
   - Aujourd'hui
   - Cette semaine
   - Ce mois
   - Période personnalisée

4. Choisissez le format:
   - PDF (pour impression)
   - Excel (pour analyse)
   - HTML (pour consultation en ligne)

#### Statistiques en Temps Réel

Le tableau de bord affiche:
- Nombre de réponses par heure
- Taux de complétion par enquête
- Temps moyen de réponse
- Taux d'abandon par section
- Questions les plus problématiques

---

### 9. Maintenance et Sauvegarde

#### Sauvegarder les Données

**Sauvegarde Manuelle:**
1. Allez dans "Paramètres"
2. Cliquez sur "Sauvegarde"
3. Cliquez sur "Créer une sauvegarde maintenant"
4. Téléchargez le fichier .db
5. Conservez-le en lieu sûr

**Sauvegarde Automatique:**
- Configurée par défaut: tous les jours à 2h du matin
- Conserve 30 jours d'historique
- Emplacement: `/backups/`

#### Restaurer depuis une Sauvegarde

⚠️ **ATTENTION: Cela supprimera toutes les données actuelles!**

1. Arrêtez le serveur
2. Remplacez le fichier `data/survey_platform.db`
3. Redémarrez le serveur
4. Vérifiez l'intégrité des données

#### Optimiser la Base de Données

Si le système devient lent:
1. Allez dans "Maintenance"
2. Cliquez sur "Optimiser la base de données"
3. Attendez la fin du processus (peut prendre plusieurs minutes)
4. Le système sera plus rapide

---

### 10. Sécurité et Bonnes Pratiques

#### Mots de Passe
- ✅ Minimum 12 caractères
- ✅ Mélange de majuscules, minuscules, chiffres, symboles
- ✅ Changez tous les 90 jours
- ❌ Ne partagez jamais vos identifiants
- ❌ N'utilisez pas le même mot de passe ailleurs

#### Connexions
- Déconnectez-vous après chaque session
- Utilisez une connexion sécurisée (HTTPS)
- Ne vous connectez pas depuis un réseau public
- Activez l'authentification à deux facteurs si disponible

#### Données
- Exportez régulièrement les données
- Conservez les sauvegardes hors ligne
- Vérifiez l'intégrité des données mensuellement
- Ne partagez pas les données sans autorisation

#### Audit
- Consultez les logs d'activité régulièrement
- Surveillez les connexions suspectes
- Vérifiez les exportations de données
- Signalez toute activité inhabituelle

---

### 11. Résolution des Problèmes Courants

#### Les participants ne peuvent pas accéder à l'enquête
- ✓ Vérifiez que l'enquête est **Active**
- ✓ Vérifiez l'URL ou le QR code
- ✓ Vérifiez que le serveur est en ligne
- ✓ Vérifiez les logs d'erreur

#### Les données ne s'affichent pas correctement
- ✓ Rafraîchissez la page (F5)
- ✓ Videz le cache du navigateur
- ✓ Vérifiez la connexion internet
- ✓ Contactez le support technique

#### L'export prend trop de temps
- ✓ Réduisez la période d'export
- ✓ Exportez par enquête plutôt que tout
- ✓ Utilisez CSV plutôt qu'Excel pour les grandes quantités
- ✓ Exportez pendant les heures creuses

#### Le système est lent
- ✓ Optimisez la base de données (Maintenance)
- ✓ Vérifiez l'espace disque disponible
- ✓ Redémarrez le serveur
- ✓ Contactez le support pour vérification

---

### 12. Journal d'Audit

#### Consulter les Logs

1. Allez dans "Audit"
2. Vous verrez toutes les actions:
   - Connexions administrateurs
   - Modifications d'enquêtes
   - Exports de données
   - Changements de configuration
   - Créations/suppressions d'utilisateurs

3. Filtrez par:
   - Utilisateur
   - Type d'action
   - Date
   - Enquête concernée

#### Informations Enregistrées
- Date et heure exacte
- Utilisateur qui a effectué l'action
- Type d'action
- Détails de l'action
- Adresse IP
- Résultat (succès/échec)

---

### 13. Configuration Système

#### Paramètres Généraux
1. Allez dans "Paramètres"
2. Onglet "Général":
   - Nom de l'organisation
   - Logo
   - Couleurs du thème
   - Langues activées

#### Paramètres des Enquêtes
- Durée maximale de session
- Permettre sauvegarde de progression
- Permettre réponses anonymes
- Afficher le temps estimé

#### Notifications
- Email pour nouvelles réponses
- Alertes pour erreurs système
- Rapports automatiques hebdomadaires

---

### 14. Support et Aide

#### Documentation
- Guide utilisateur: `/docs/USER_GUIDE.md`
- Guide déploiement: `/docs/DEPLOYMENT.md`
- API documentation: `/docs/API.md`

#### Contact Support
- **Email**: support@patrimoine.gov.ma
- **Téléphone**: +212 XXX XXX XXX
- **Heures**: Lundi-Vendredi, 9h-17h
- **Urgences**: 24/7 pour problèmes critiques

#### Ressources
- Base de connaissances: En développement
- Vidéos tutoriels: À venir
- Forum communauté: En préparation

---

## Checklist Quotidienne pour Administrateurs

- [ ] Vérifier le tableau de bord
- [ ] Consulter les nouvelles réponses
- [ ] Vérifier les logs d'erreur
- [ ] Vérifier que les sauvegardes ont réussi
- [ ] Répondre aux demandes de support

## Checklist Hebdomadaire

- [ ] Exporter les données pour archivage
- [ ] Analyser les statistiques
- [ ] Vérifier les performances du système
- [ ] Mettre à jour la documentation si nécessaire
- [ ] Revoir les accès utilisateurs

## Checklist Mensuelle

- [ ] Optimiser la base de données
- [ ] Tester la restauration depuis sauvegarde
- [ ] Revoir les politiques de sécurité
- [ ] Générer rapports mensuels
- [ ] Planifier les mises à jour système

---

**Version**: 1.0  
**Dernière mise à jour**: 2024  
**Contact**: admin@patrimoine.gov.ma

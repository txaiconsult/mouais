# Active Audition Agenda

Active Audition Agenda est une application web qui permet de planifier des rendez-vous de suivi pour des patients en utilisant une IA pour suggérer des dates.

## Fonctionnalités

- **Suggestion par IA**: Suggère des dates de rendez-vous (J+7, J+14, J+21, J+30) en tenant compte des préférences du patient.
- **Formulaire Patient**: Collecte le nom du patient, la date de départ (J0) et les préférences.
- **Liste de Rendez-vous**: Affiche les dates générées et permet de les modifier ou de les supprimer.
- **Impression**: Permet d'imprimer la liste des rendez-vous.
- **Ajout/Modification**: Permet d'ajouter manuellement des rendez-vous ou de modifier ceux qui sont suggérés.
- **Persistance**: Se souvient des données du formulaire entre les sessions.

## Stack Technique

- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- ShadCN UI
- Genkit (Google AI)
- date-fns
- react-hook-form & zod
- framer-motion

## Installation et Démarrage

1.  **Cloner le dépôt**
    ```bash
    git clone <repository-url>
    cd Active-Audition-Agenda
    ```

2.  **Installer les dépendances**
    ```bash
    npm install
    ```

3.  **Configurer les variables d'environnement**
    Créez un fichier `.env` à la racine du projet et ajoutez votre clé API Gemini. Pour le développement local avec Genkit, une clé d'API est nécessaire pour utiliser les modèles Google AI.
    ```
    GEMINI_API_KEY=VOTRE_CLE_API_ICI
    ```

4.  **Lancer le serveur de développement**
    ```bash
    npm run dev
    ```
    L'application sera disponible à l'adresse `http://localhost:9002`.

5.  **(Optionnel) Lancer le simulateur Genkit**
    Pour tester et déboguer les flux Genkit, vous pouvez utiliser l'UI de développement de Genkit.
    ```bash
    npm run genkit:watch
    ```
    L'UI de Genkit sera disponible à l'adresse `http://localhost:4000`.

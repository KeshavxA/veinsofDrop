# veinsofDrop

Connect blood donors with people who need donations. Built with React and Firebase.

| | |
| --- | --- |
| **Live demo** | [https://veinsofdrop.web.app/](https://veinsofdrop.web.app/) |
| **Repository** | [https://github.com/KeshavxA/veinsofDrop](https://github.com/KeshavxA/veinsofDrop) |

## Features

- **Authentication** — Register, log in, and sign out (Firebase Auth).
- **Donor directory** — Signed-in users can browse registered donors and start contact via email (requests are logged in Firestore).
- **Blood requests** — Submit need details (blood group, units, hospital/location, urgency).
- **Whole-blood compatibility** — Filter donors by the patient’s needed type using standard ABO/Rh rules for red cell donation.
- **Urgent & critical strip** — Highlights open requests marked urgent or critical so donors can jump to compatible donors quickly.
- **Profile** — Save name, phone, blood type, and location to your account document.

## Tech stack

- [React](https://react.dev/) 19 · [Vite](https://vite.dev/) 7
- [React Router](https://reactrouter.com/) 7
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Firebase](https://firebase.google.com/) (Auth, Firestore)

## Local development

```bash
git clone https://github.com/KeshavxA/veinsofDrop.git
cd veinsofDrop
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Configure Firebase in `firebase.js` and enable Email/Password auth and Firestore in the Firebase console. See `FIREBASE_SETUP.md` for more detail.

## Build

```bash
npm run build
```

Output is written to `dist/`. The project includes Firebase Hosting config (`firebase.json`) for deploying to the same style of URL as the live demo.

## Disclaimer

This app helps people find and contact donors; it does not replace hospital blood banks or medical advice. Always follow local clinical and legal requirements for donation and transfusion.

## License

ISC (see `package.json`).

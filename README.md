# Progrum

New-client intake boards for CBC Settlement Funding. A sales rep keeps a list of clients. Each client has a puzzle of the documents that file needs. A piece is filled by pasting an https link to the document on the company shared drive.

The standard 11 documents live in [`src/config/pieces.ts`](src/config/pieces.ts). Edit that list to add, rename, or remove them. State and insurer rules in the same file can append extra pieces. The reference data behind those rules is in [`src/config/catalog.ts`](src/config/catalog.ts).

## Privacy

This site is published on public GitHub Pages. There is no login. Anyone with the link can view and edit the boards.

- Rep names, client names, and document links are stored in Cloud Firestore, in the `progrum` collection only. Edits show up on every open copy of the site within a few seconds.
- Pieces do not hold files. Pasting or dropping a link only saves the address. Progrum never fetches, previews, or proxies the linked document.
- Open uses a new tab with `rel="noopener noreferrer"`. Whether the document opens still depends on the shared drive's own permissions.
- There is no analytics and no font host. The Firebase SDK is bundled. The page may connect only to this site and to Firestore (`firestore.googleapis.com`, and `firebaseinstallations.googleapis.com` if the SDK asks for an installation id).
- An optional name in the header is saved in this browser only and stamped on edits. It is not an account.
- Export downloads a JSON backup. Import replaces the shared boards with that file. **Import local boards** copies a previous browser-only copy up once. Those three actions are under **Admin** in the header.
- Delete a client or a rep to remove them for everyone. A confirmation is required. Files on the shared drive are not touched.
- Do not commit client names, backup files, or filled documents. `.gitignore` blocks common document types (pdf, jpg, png, heic, docx, and others) outside the app's own asset folders, and it ignores `progrum-backup-*.json`. The blank advance letter in `public/templates` is the exception: it contains no client data.
- **Advance document**, **Life Affidavit**, and **2 Person Notifier** build letters in this browser and download them. The files, questionnaire answers, and contact details are not saved to Firestore, local storage, or the shared boards.

A new shared list starts with one rep, James. Deleting that rep stays deleted.

## Using the boards

1. Open a rep, then add a client. The reps screen keeps **Quick links** in a slim sidebar (a drawer on a phone) for the shared-drive Advance, Fasano, Authorization to Release, and Best Interest Declaration templates. **Advance document** on that screen and on every client board fills the blank advance letter locally. When a client is life contingent, the board also fills a Life Affidavit and a Designation of Continued Contact (2 Person Notifier) in the browser. None of those letters are saved. The wire fee default is `WIRE_FEE` in `src/config/catalog.ts` (`null` means type it each time).
2. Set the state, the insurance company, and check **SPIA** for a single premium immediate annuity. A SPIA file does not require Hold Time, the DocuSign summary for Hold Time, or IPA. Check **LA abuse** to add Point Allocation and First Payment Breakdown and clear the insurance company. **Mark as funded** moves a finished board into the Funded bin without deleting it. **Unfund** puts it back on that rep's active list. Guidance on the board updates, and extra pieces appear when that state or insurer requires another document. Check **Life contingent** on create, or later on the board, to also require Life Affidavit, 2 Person Notifier, Fasano, DocuCert for Fasano, and Life Expectancy Doc. Unchecking hides those pieces and keeps any links already saved. **IPA** adds IPA Invoice and IPA W9. States in `IPA_REQUIRED_STATES` (`src/config/catalog.ts`) force those pieces on. Every other state leaves the checkbox optional.
3. Click a grey piece and paste an https link, or drag a link onto the piece. An optional display name overrides the name taken from the address. The piece shows that name, the date it was added, and an Open button.
4. The status line reads “X of N complete” and lists every missing piece. N is 11 unless extra documents apply, including the five life-contingent pieces when that option is on. **Copy all links** includes those pieces in the same way.
5. Search in the header finds a client across every rep. Type a name in **Your name** if you want edits stamped with it.
6. **Copy all links** builds an email-ready list. Turn on **Still needed** to append missing pieces, and **State forms** to include that state’s blank templates.

Company-form links shown next to some extra pieces are blank templates. They do not fill the piece. Paste the link to the client's own document.

## Develop

```bash
npm ci
npm run dev
```

Open the URL Vite prints. The production build uses relative asset paths, so the same files work at the Pages URL regardless of the repository name’s capitalization.

```bash
npm run build
npm run preview
```

## Shared boards

There is no login. Firestore listeners keep every open copy of the site in sync. Reps live at `progrum/data/reps` and clients, including their links, live at `progrum/data/clients`. A `progrum/meta` document records that the first rep, James, has already been created. The public web config is in `src/config/firebase.ts`.

## GitHub Pages

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds the site and deploys `dist` to GitHub Pages when `main` is pushed. Pull requests only build.

Before the first deploy, in the GitHub repository settings, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

After a push to `main` finishes deploying, the site is at:

https://jrairigh1.github.io/Progrum/

## What came from CBCisstant

State and insurer behavior is transcribed from the public [CBCisstant](https://github.com/Jrairigh1/CBCisstant) `index.html` (the copy that includes hold time and underwriter). No client names or client files were in that repo, and none were copied. The catalog is company reference data: rate caps, IPA, affidavit or declaration, no-poach states, hold-time days, counsel, fees, underwriter, county notes, insurer processing, and Bifco / MetLife split rules. Blank SharePoint form addresses that CBCisstant already publishes are included only as optional “company form” links.

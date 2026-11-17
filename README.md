# Progrum

New-client intake boards for CBC Settlement Funding. A sales rep keeps a list of clients. Each client has a puzzle of the documents that file needs. A piece is filled by pasting an https link to the document on the company shared drive.

The standard 11 documents live in [`src/config/pieces.ts`](src/config/pieces.ts). Edit that list to add, rename, or remove them. State and insurer rules in the same file can append extra pieces. The reference data behind those rules is in [`src/config/catalog.ts`](src/config/catalog.ts).

## Privacy

This site is published on public GitHub Pages. Client information stays on the computer that entered it.

- Client names, rep names, and document links are stored in IndexedDB in this browser only.
- Pieces do not hold files. Pasting or dropping a link only saves the address. Progrum never fetches, previews, or proxies the linked document.
- Open uses a new tab with `rel="noopener noreferrer"`. Whether the document opens still depends on the shared drive's own permissions.
- There is no analytics, no third-party CDN, and no font host. Dependencies are bundled into the site.
- The built pages send a Content-Security-Policy that blocks connections and frames to anywhere but this site.
- Export downloads a JSON backup to this computer. Import reads a backup file you choose. Neither is uploaded.
- Delete a client, or a rep, to remove their names and links from this browser. A confirmation is required. Files on the shared drive are not touched.
- Do not commit client names, backup files, or documents. `.gitignore` blocks common document types (pdf, jpg, png, heic, docx, and others) outside the app's own asset folders, and it ignores `progrum-backup-*.json`.

The first visit on a browser creates one rep, James. Deleting that rep stays deleted. Refreshing does not recreate it.

## Using the boards

1. Open a rep, then add a client.
2. Set the state, the insurance company, and whether the file is a structured settlement or a SPIA. Guidance on the board updates, and extra pieces appear when that state or insurer requires another document.
3. Click a grey piece and paste an https link, or drag a link onto the piece. An optional display name overrides the name taken from the address. The piece shows that name, the date it was added, and an Open button.
4. The status line reads “X of N complete” and lists every missing piece. N is 11 unless extra documents apply.
5. Search in the header finds a client across every rep on this browser.

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

## GitHub Pages

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds the site and deploys `dist` to GitHub Pages when `main` is pushed. Pull requests only build.

Before the first deploy, in the GitHub repository settings, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

After a push to `main` finishes deploying, the site is at:

https://jrairigh1.github.io/Progrum/

## What came from CBCisstant

State and insurer behavior is transcribed from the public [CBCisstant](https://github.com/Jrairigh1/CBCisstant) `index.html` (the copy that includes hold time and underwriter). No client names or client files were in that repo, and none were copied. The catalog is company reference data: rate caps, IPA, affidavit or declaration, no-poach states, hold-time days, counsel, fees, underwriter, county notes, insurer processing, and Bifco / MetLife split rules. Blank SharePoint form addresses that CBCisstant already publishes are included only as optional “company form” links.

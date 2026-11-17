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

## Microsoft 365 sharing

Company sign-in is off until `src/config/m365.ts` has CBC’s real client ID, tenant ID, and SharePoint site URL. Until then, boards stay in this browser. The README section below is the admin checklist. After those values are filled in and the site is rebuilt, people sign in with a CBC work account and the boards are stored in three SharePoint lists (`ProgrumReps`, `ProgrumClients`, `ProgrumLinks`). The app creates those lists the first time someone signs in, if they are missing. Coworkers see updates when they return to the tab and about every 30 seconds. Each saved link shows who changed it and when.

A signed-in person can choose **Import this browser** to copy boards that were saved on that browser into SharePoint. Export still downloads a JSON backup. Import of that file replaces the boards currently on screen.

### Checklist for the Microsoft 365 admin

1. Create a SharePoint site for these boards, or pick an existing CBC site. People who should use Progrum need Edit access on that site. Example: `https://<tenant>.sharepoint.com/sites/Progrum`.
2. In the Microsoft Entra admin center, open **Identity → Applications → App registrations → New registration**.
   - Name: `Progrum`
   - Supported account types: **Accounts in this organizational directory only** (CBC’s tenant, not personal Microsoft accounts)
   - Redirect URI: platform **Single-page application (SPA)**, URL `https://jrairigh1.github.io/Progrum/`
3. After it is created, copy the **Application (client) ID** and the **Directory (tenant) ID**.
4. Open **API permissions → Add a permission → Microsoft Graph → Delegated permissions**.
   - Add **User.Read**
   - Add **Sites.Selected** (preferred). This lets Progrum touch only the site you grant in the next step, which matters because the client ID will be in a public web app.
   - Alternative: **Sites.ReadWrite.All** instead of Sites.Selected. That is one consent click and needs no extra site grant, but the signed-in app can then read and write every SharePoint site that person can open, not only the Progrum site. If you choose this, also change `graphScopes` in `src/config/m365.ts` from `Sites.Selected` to `Sites.ReadWrite.All`.
5. Click **Grant admin consent**.
6. If you used Sites.Selected, grant this app write on the one site. As a SharePoint admin, in Graph Explorer (`https://developer.microsoft.com/graph/graph-explorer`) signed in with an account that can manage site permissions:
   - `GET https://graph.microsoft.com/v1.0/sites/<hostname>:/sites/<site-path>` and copy the site `id`
   - `POST https://graph.microsoft.com/v1.0/sites/<site-id>/permissions` with body:

```json
{
  "roles": ["write"],
  "grantedToIdentities": [
    {
      "application": {
        "id": "<application-client-id>",
        "displayName": "Progrum"
      }
    }
  ]
}
```

7. Send these three values back so they can be put in `src/config/m365.ts`: the application (client) ID, the directory (tenant) ID, and the full SharePoint site URL.

The lists do not need to be created by hand. The first signed-in visit creates them.

## GitHub Pages

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds the site and deploys `dist` to GitHub Pages when `main` is pushed. Pull requests only build.

Before the first deploy, in the GitHub repository settings, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

After a push to `main` finishes deploying, the site is at:

https://jrairigh1.github.io/Progrum/

## What came from CBCisstant

State and insurer behavior is transcribed from the public [CBCisstant](https://github.com/Jrairigh1/CBCisstant) `index.html` (the copy that includes hold time and underwriter). No client names or client files were in that repo, and none were copied. The catalog is company reference data: rate caps, IPA, affidavit or declaration, no-poach states, hold-time days, counsel, fees, underwriter, county notes, insurer processing, and Bifco / MetLife split rules. Blank SharePoint form addresses that CBCisstant already publishes are included only as optional “company form” links.

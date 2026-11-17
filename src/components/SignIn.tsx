import { redirectUri } from "../config/m365";
import { useStore } from "../store";

export function SignIn() {
  const store = useStore();
  return (
    <div className="signin">
      <div className="signin-card">
        <p className="signin-mark">CBC Settlement Funding</p>
        <h1>Sign in to Progrum</h1>
        <p>
          Shared boards are kept in the company’s SharePoint site. Sign in with your CBC work account to see them and to
          update them for your coworkers.
        </p>
        <button type="button" className="btn" onClick={() => store.signIn()}>
          Sign in with Microsoft
        </button>
        {store.fatal && <p className="form-error">{store.fatal}</p>}
        <p className="hint">Microsoft will send you back to {redirectUri()}</p>
      </div>
    </div>
  );
}

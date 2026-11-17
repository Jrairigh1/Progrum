import { useEffect, useState } from "react";
import { BoardPage } from "./components/BoardPage";
import { ClientsPage } from "./components/ClientsPage";
import { RepsPage } from "./components/RepsPage";
import { Shell } from "./components/Shell";
import { parseHash, type Route } from "./lib/routing";
import { SignIn } from "./components/SignIn";
import { useStore } from "./store";

function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseHash(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

export function App() {
  const store = useStore();
  const route = useRoute();

  useEffect(() => {
    let title = "Progrum · CBC Settlement Funding";
    if (route.name === "rep") {
      const rep = store.reps.find((item) => item.id === route.repId);
      if (rep) title = `${rep.name} · Progrum`;
    }
    if (route.name === "client") {
      const client = store.clients.find((item) => item.id === route.clientId);
      if (client) title = `${client.name} · Progrum`;
    }
    document.title = title;
  }, [route, store.clients, store.reps]);

  if (!store.ready) {
    return (
      <div className="splash">
        <p>Progrum</p>
      </div>
    );
  }

  if (store.mode === "sharepoint" && !store.account) {
    return <SignIn />;
  }

  if (store.fatal && store.reps.length === 0) {
    return (
      <div className="splash">
        <h1>Progrum</h1>
        <p>{store.fatal}</p>
        {store.account && (
          <button type="button" className="btn" onClick={() => store.signOut()}>
            Sign out
          </button>
        )}
      </div>
    );
  }

  return (
    <Shell>
      {route.name === "reps" && <RepsPage />}
      {route.name === "rep" && <ClientsPage repId={route.repId} />}
      {route.name === "client" && <BoardPage clientId={route.clientId} />}
    </Shell>
  );
}

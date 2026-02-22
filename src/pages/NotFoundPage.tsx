import { NOT_FOUND_MESSAGES } from "../constants/messages/notFound";

interface NotFoundPageProps {
  onBackToSolve: () => void;
}

export function NotFoundPage({ onBackToSolve }: NotFoundPageProps): JSX.Element {
  return (
    <div className="notfound-page">
      <section className="panel notfound-panel">
        <h2>{NOT_FOUND_MESSAGES.title}</h2>
        <p className="hint">{NOT_FOUND_MESSAGES.hint}</p>
        <button className="btn" onClick={onBackToSolve} type="button">
          {NOT_FOUND_MESSAGES.backToSolve}
        </button>
      </section>
    </div>
  );
}

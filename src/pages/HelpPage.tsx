import { HELP_MESSAGES } from "../constants/messages";

export function HelpPage(): JSX.Element {
  return (
    <div className="help-page">
      <section className="panel">
        <h2>{HELP_MESSAGES.title}</h2>
        <p className="hint">{HELP_MESSAGES.hint}</p>
        <ul className="help-list">
          {HELP_MESSAGES.usageItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>{HELP_MESSAGES.inputFormatTitle}</h2>
        <ul className="help-list">
          {HELP_MESSAGES.inputFormatItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>{HELP_MESSAGES.inkTitle}</h2>
        <ul className="help-list">
          {HELP_MESSAGES.inkItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>{HELP_MESSAGES.reviewTitle}</h2>
        <p className="hint">{HELP_MESSAGES.reviewHint}</p>
      </section>
    </div>
  );
}

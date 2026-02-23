import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HELP_MESSAGES } from "../../constants/messages/help";
import { HelpPage } from "../HelpPage";

describe("HelpPage", () => {
  it("renders all sections and message items", () => {
    render(<HelpPage />);

    expect(screen.getByRole("heading", { name: HELP_MESSAGES.title })).toBeInTheDocument();
    expect(screen.getByText(HELP_MESSAGES.hint)).toBeInTheDocument();
    for (const item of HELP_MESSAGES.usageItems) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: HELP_MESSAGES.inputFormatTitle })).toBeInTheDocument();
    for (const item of HELP_MESSAGES.inputFormatItems) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: HELP_MESSAGES.inkTitle })).toBeInTheDocument();
    for (const item of HELP_MESSAGES.inkItems) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: HELP_MESSAGES.reviewTitle })).toBeInTheDocument();
    expect(screen.getByText(HELP_MESSAGES.reviewHint)).toBeInTheDocument();
  });
});

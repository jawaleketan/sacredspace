import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeityCard } from "../DeityCard";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params, ...props }: any) => {
    const href = to.replace("$slug", params?.slug ?? "");
    return <a href={href} {...props}>{children}</a>;
  },
}));

describe("DeityCard", () => {
  const defaultProps = {
    name: "Ganesha",
    slug: "ganesha",
    description: "The remover of obstacles",
    imageUrl: null,
  };

  it("renders deity name", () => {
    render(<DeityCard {...defaultProps} />);
    expect(screen.getByText("Ganesha")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<DeityCard {...defaultProps} />);
    expect(screen.getByText("The remover of obstacles")).toBeInTheDocument();
  });

  it("shows initial letter when no image", () => {
    render(<DeityCard {...defaultProps} />);
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("renders image when imageUrl is provided", () => {
    render(<DeityCard {...defaultProps} imageUrl="/uploads/ganesha.png" />);
    const img = screen.getByAltText("Ganesha");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/uploads/ganesha.png");
  });

  it("links to deity page", () => {
    render(<DeityCard {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/deity/ganesha");
  });
});

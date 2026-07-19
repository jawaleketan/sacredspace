import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../Toast";

function TestConsumer() {
  const { toast } = useToast();
  return (
    <div>
      <button onClick={() => toast("Test message", "success")}>Show toast</button>
      <button onClick={() => toast("Error message", "error")}>Show error</button>
      <button onClick={() => toast("Info message", "info")}>Show info</button>
    </div>
  );
}

describe("Toast", () => {
  it("renders children", () => {
    render(
      <ToastProvider>
        <div>Child content</div>
      </ToastProvider>,
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("shows a toast when triggered", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("Show toast").click();
    });

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("shows multiple toasts", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("Show toast").click();
      screen.getByText("Show error").click();
    });

    expect(screen.getByText("Test message")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("removes toast after timeout", async () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("Show toast").click();
    });

    expect(screen.getByText("Test message")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Test message")).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarriedGuard } from "@/components/dashboard/married-guard";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const mockUseSession = vi.mocked(useSession);
const mockUsePathname = vi.mocked(usePathname);

describe("MarriedGuard", () => {
  it("renders children when user is not married", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", email: "a@b.com", isMarried: false }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    mockUsePathname.mockReturnValue("/dashboard");

    render(
      <MarriedGuard>
        <div data-testid="child">Dashboard Content</div>
      </MarriedGuard>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("blocks content and shows congratulations when user is married", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", email: "a@b.com", isMarried: true }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    mockUsePathname.mockReturnValue("/dashboard");

    render(
      <MarriedGuard>
        <div data-testid="child">Dashboard Content</div>
      </MarriedGuard>
    );

    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    expect(screen.getByText("Congratulations on Your Marriage!")).toBeInTheDocument();
  });

  it("allows settings page through even when married", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", email: "a@b.com", isMarried: true }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    mockUsePathname.mockReturnValue("/settings");

    render(
      <MarriedGuard>
        <div data-testid="child">Settings Content</div>
      </MarriedGuard>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("allows settings sub-paths through when married", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", email: "a@b.com", isMarried: true }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    mockUsePathname.mockReturnValue("/settings?tab=account");

    render(
      <MarriedGuard>
        <div data-testid="child">Settings Account</div>
      </MarriedGuard>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows link to settings when married and blocked", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", email: "a@b.com", isMarried: true }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    mockUsePathname.mockReturnValue("/matches");

    render(
      <MarriedGuard>
        <div>Content</div>
      </MarriedGuard>
    );

    const link = screen.getByRole("link", { name: /go to settings/i });
    expect(link).toHaveAttribute("href", "/settings?tab=account");
  });

  it("renders children when session has no user", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });
    mockUsePathname.mockReturnValue("/dashboard");

    render(
      <MarriedGuard>
        <div data-testid="child">Content</div>
      </MarriedGuard>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("blocks all protected pages when married", () => {
    const protectedPaths = [
      "/dashboard",
      "/matches",
      "/interests",
      "/messages",
      "/profile",
      "/membership",
      "/activity",
      "/contact-packs",
      "/shortlist",
    ];

    for (const path of protectedPaths) {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", email: "a@b.com", isMarried: true }, expires: "" },
        status: "authenticated",
        update: vi.fn(),
      });
      mockUsePathname.mockReturnValue(path);

      const { unmount } = render(
        <MarriedGuard>
          <div data-testid="child">Content</div>
        </MarriedGuard>
      );

      expect(screen.queryByTestId("child")).not.toBeInTheDocument();
      unmount();
    }
  });
});

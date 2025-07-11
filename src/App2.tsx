import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { CreateCampaign } from "./CreateCampaign";
import { ReviewPosts } from "./ReviewPosts";
import { CompanyAssets } from "./CompanyAssets";
import { CampaignHistory } from "./CampaignHistory";
import { Navigation } from "./Navigation";
import { Menu } from "lucide-react";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from "./components/ui/sidebar";
import { Separator } from "./components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb";
import {EditPhoto} from "./EditPhoto";
import { CampaignList } from "./CampaignList";

export default function App2() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"home" | "company" | "history" | "editPhoto">("home");
  console.log(selectedCampaignId)
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full">
        <Authenticated>
          <Sidebar>
            <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
          </Sidebar>
          <SidebarInset className="flex-1 w-0">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {currentTab === "home"
                        ? "Home"
                        : currentTab === "company"
                          ? "Company Assets"
                          : currentTab === "history"
                            ? "Campaign History"
                            : "Edit Photo"  }
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <main className="flex-1 p-4">
              <div className="flex flex-col gap-8">
                <Content
                  currentTab={currentTab}
                  selectedCampaignId={selectedCampaignId}
                  setSelectedCampaignId={setSelectedCampaignId}
                  setCurrentTab={setCurrentTab}
                />
              </div>
            </main>
          </SidebarInset>
        </Authenticated>
        <Unauthenticated>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}

function Content({
  currentTab,
  selectedCampaignId,
  setSelectedCampaignId,
  setCurrentTab,
}: {
  currentTab: "home" | "company" | "history" |"editPhoto";
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string | null) => void;
  setCurrentTab: (tab: "home" | "company" | "history"|"editPhoto") => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <Unauthenticated>
        <div className="text-center">
          <h1 className="text-5xl font-bold accent-text mb-4">
            AI Marketing Agent
          </h1>
          <p className="text-xl text-slate-600">Sign in to get started</p>
        </div>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        {selectedCampaignId ? (
          // Add tab state for ReviewPosts vs EditPhoto
          <SelectedCampaignTabs
            campaignId={selectedCampaignId}
            onBack={() => setSelectedCampaignId(null)}
          />
        ) : (
          <>
            {currentTab === "home" && (
              <CreateCampaign onCampaignCreated={setSelectedCampaignId} />
            )}
            {currentTab === "company" && <CompanyAssets />}
            {currentTab === "history" && (
              <CampaignHistory
                onCampaignSelect={(id) => {
                  setSelectedCampaignId(id);
                  setCurrentTab("home");
                }}
              />
            )}
            {/* Remove direct rendering of EditPhoto here */}
          </>
        )}
      </Authenticated>
    </div>
  );
}

function SelectedCampaignTabs({
  campaignId,
  onBack,
}: {
  campaignId: string;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'review' | 'editPhoto'>('review');
  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('review')}
          className={`text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors ${tab === 'review' ? 'underline' : ''}`}
          disabled={tab === 'review'}
        >
          {/* Left arrow icon for Review Posts */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Review Posts
        </button>
        <button
          onClick={() => setTab('editPhoto')}
          className={`text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors ${tab === 'editPhoto' ? 'underline' : ''}`}
          disabled={tab === 'editPhoto'}
        >
          {/* Photo icon for Edit Photo */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7V6a2 2 0 012-2h12a2 2 0 012 2v1M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7l4.586 4.586a2 2 0 002.828 0L16 7" />
          </svg>
          Edit Photo
        </button>
      </div>
      {tab === 'review' && <ReviewPosts campaignId={campaignId} onBack={onBack} />}
      {tab === 'editPhoto' && <EditPhoto campaignId={campaignId} />}
    </div>
  );
}

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
import { AiImage } from "./components/ai/AiImage";
import { ImageGeneration } from "./components/ImageGeneration/ImageGeneration";

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
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <Breadcrumb className="hidden sm:block">
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
              <div className="sm:hidden text-sm font-medium">
                {currentTab === "home"
                  ? "Home"
                  : currentTab === "company"
                    ? "Company Assets"
                    : currentTab === "history"
                      ? "Campaign History"
                      : "Edit Photo"}
              </div>
            </header>
            <main className="flex-1 p-2 sm:p-4">
              <div className="flex flex-col gap-4 sm:gap-8">
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
  const [tab, setTab] = useState<'review' | 'editPhoto'|'AiImage'|'imageGeneration'>('review');
  return (
    <div>
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => setTab('review')}
          className={`text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 sm:gap-2 transition-colors px-2 py-1 rounded ${tab === 'review' ? 'bg-indigo-50 underline' : ''}`}
          disabled={tab === 'review'}
        >
          {/* Left arrow icon for Review Posts */}
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-xs sm:text-sm">Review Posts</span>
        </button>
        <button
          onClick={() => setTab('editPhoto')}
          className={`text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 sm:gap-2 transition-colors px-2 py-1 rounded ${tab === 'editPhoto' ? 'bg-indigo-50 underline' : ''}`}
          disabled={tab === 'editPhoto'}
        >
          {/* Photo icon for Edit Photo */}
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7V6a2 2 0 012-2h12a2 2 0 012 2v1M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7l4.586 4.586a2 2 0 002.828 0L16 7" />
          </svg>
          <span className="text-xs sm:text-sm">Edit Photo</span>
        </button>
        <button
          onClick={() => setTab('AiImage')}
          className={`text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 sm:gap-2 transition-colors px-2 py-1 rounded ${tab === 'AiImage' ? 'bg-indigo-50 underline' : ''}`}
          disabled={tab === 'AiImage'}
        >
          {/* AI icon for AI Image */}
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs sm:text-sm">AI Image</span>
        </button>
        <button
          onClick={() => setTab('imageGeneration')}
          className={`text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 sm:gap-2 transition-colors px-2 py-1 rounded ${tab === 'imageGeneration' ? 'bg-indigo-50 underline' : ''}`}
          disabled={tab === 'imageGeneration'}
        >
          {/* Image generation icon */}
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs sm:text-sm">Generate</span>
        </button>
        
      </div>
      {tab === 'review' && <ReviewPosts campaignId={campaignId} onBack={onBack} />}
      {tab === 'editPhoto' && <EditPhoto campaignId={campaignId} />}
      {tab === 'AiImage' && <AiImage campaignId={campaignId}/>}
      {tab === 'imageGeneration' && <ImageGeneration campaignId={campaignId} />}
    </div>
  );
}

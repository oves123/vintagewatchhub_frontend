import Navbar from "../components/Navbar";

export default function Loading() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <main className="max-w-[1300px] mx-auto px-4 py-8 w-full">
        <div className="animate-pulse">
          <div className="h-10 bg-surface rounded-xl w-48 mb-8 border border-border" />

          <div className="flex gap-4 mb-8">
            <div className="h-8 bg-surface rounded-xl w-20 border border-border" />
            <div className="h-8 bg-surface rounded-xl w-24 border border-border" />
            <div className="h-8 bg-surface rounded-xl w-16 border border-border" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border">
                <div className="aspect-[4/3] bg-background flex items-center justify-center">
                  <div className="w-full h-full bg-gray-200" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded-xl w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-xl w-1/2" />
                  <div className="h-6 bg-gray-200 rounded-xl w-1/3" />
                  <div className="h-3 bg-gray-200 rounded-xl w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

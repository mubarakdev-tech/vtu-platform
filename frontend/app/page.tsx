import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="text-center py-24 px-6">
        <h2 className="text-5xl font-bold text-gray-800">
          Buy Airtime & Data Instantly
        </h2>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Fast, secure and reliable VTU platform for Airtime, Data,
          Electricity Bills, Cable TV subscriptions and more.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Get Started
          </button>

          <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50">
            Learn More
          </button>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h3 className="text-3xl font-bold text-center mb-10">
          Our Services
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h4 className="text-xl font-semibold">📱 Airtime</h4>
            <p className="mt-2 text-gray-600">
              Recharge all major networks instantly.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h4 className="text-xl font-semibold">🌐 Data</h4>
            <p className="mt-2 text-gray-600">
              Affordable data bundles anytime.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h4 className="text-xl font-semibold">⚡ Electricity</h4>
            <p className="mt-2 text-gray-600">
              Pay electricity bills with ease.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h4 className="text-xl font-semibold">📺 Cable TV</h4>
            <p className="mt-2 text-gray-600">
              Renew DSTV, GOTV and Startimes subscriptions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
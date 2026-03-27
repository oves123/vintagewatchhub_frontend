import Navbar from "../../components/Navbar";

export default function Dashboard() {

 return (

  <div>

   <Navbar />

   <div className="max-w-6xl mx-auto p-6">

    <h1 className="text-3xl font-bold">
     Seller Dashboard
    </h1>

    <div className="grid grid-cols-3 gap-6 mt-6">

     <div className="p-4 bg-gray-100 rounded">
      Active Listings
      <h2 className="text-xl font-bold">5</h2>
     </div>

     <div className="p-4 bg-gray-100 rounded">
      Orders
      <h2 className="text-xl font-bold">3</h2>
     </div>

     <div className="p-4 bg-gray-100 rounded">
      Revenue
      <h2 className="text-xl font-bold">₹25,000</h2>
     </div>

    </div>

   </div>

  </div>

 );

}
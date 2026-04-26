import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import RFQList from "./pages/RFQList";
import RFQDetails from "./pages/RFQDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreateRFQ from "./pages/CreateRFQ";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<RFQList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/create-rfq" element={<CreateRFQ />} />
        <Route path="/rfq/:id" element={<RFQDetails />} />
      </Routes>
    </BrowserRouter>
  );
}
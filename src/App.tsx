import { Route, Routes } from "react-router-dom"
import Home from "./client/pages/Home"
import Welcome from "./client/pages/Welcome"
import Login from "./client/pages/Login"
import Loans from "./client/pages/Loans"
import History from "./client/pages/History"
import ApplyForProducts from "./client/pages/ApplyForProducts"

function App() {

  return (
    <>
      <Routes>
        <Route index element={<Welcome/>}/>
        <Route path="/home" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/loans" element={<Loans/>}/>
        <Route path="/history" element={<History/>}/>
        <Route path="/apply-products" element={<ApplyForProducts/>}/>
      </Routes>
    </>
  )
}

export default App

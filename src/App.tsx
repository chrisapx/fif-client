import { Route, Routes } from "react-router-dom"
import Home from "./client/pages/Home"
import Login from "./client/pages/Login"
import SelectAccount from "./client/pages/SelectAccount"
import Loans from "./client/pages/Loans"
import History from "./client/pages/History"
import ApplyForProducts from "./client/pages/ApplyForProducts"
// Temporarily disabled - will be enabled later
// import LoanRequestForm from "./client/components/forms/LoanRequestForm"
// import NewAccountForm from "./client/components/forms/NewAccountForm"
import Profile from "./client/pages/Profile"
import Transactions from "./client/pages/Transactions"
import MoreActions from "./client/pages/MoreActions"
import CreateUserAccount from "./client/components/forms/CreateUserAccount"
import FundMyAccount from "./client/pages/FundMyAccount"
import NewTransactionForm from "./client/components/forms/NewTransactionForm"
import MobileOnlyWrapper from "./components/MobileOnlyWrapper"
import Welcome from "./client/pages/Welcome"
import { useSessionManager } from "./hooks/useSessionManager"

function App() {
  // Initialize session manager (5min session, 30sec inactivity timeout)
  useSessionManager();

  return (
    <MobileOnlyWrapper>
      <Routes>
        <Route index element={<Welcome/>}/>
        <Route path="/home" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/select-account" element={<SelectAccount/>}/>
        <Route path="/create-account" element={<CreateUserAccount/>}/>
        <Route path="/loans" element={<Loans/>}/>
        <Route path="/history" element={<History/>}/>
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/transactions" element={<Transactions/>}/>
        <Route path="/more" element={<MoreActions/>}/>
        <Route path="/apply-products" element={<ApplyForProducts/>}/>
        <Route path="fund-account" element={<FundMyAccount/>} />
      </Routes>
      <NewTransactionForm/>
      {/* Temporarily disabled - will be enabled later */}
      {/* <LoanRequestForm/> */}
      {/* <NewAccountForm/> */}
    </MobileOnlyWrapper>
  )
}

export default App

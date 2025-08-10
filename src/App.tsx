import { Route, Routes } from "react-router-dom"
import Home from "./client/pages/Home"
import Welcome from "./client/pages/Welcome"
import Login from "./client/pages/Login"
import Loans from "./client/pages/Loans"
import History from "./client/pages/History"
import ApplyForProducts from "./client/pages/ApplyForProducts"
import LoanRequestForm from "./client/components/forms/LoanRequestForm"
import NewAccountForm from "./client/components/forms/NewAccountForm"
import Profile from "./client/pages/Profile"
import Transactions from "./client/pages/Transactions"
// import AdminActions from "./client/pages/AdminActions"
import MoreActions from "./client/pages/MoreActions"
import CreateUserAccount from "./client/components/forms/CreateUserAccount"
import FundMyAccount from "./client/pages/FundMyAccount"
import NewTransactionForm from "./client/components/forms/NewTransactionForm"

function App() {
  // const navigate = useNavigate();
  // if(!isAuthenticated() || !getAuthUser()){
  //   navigate('/login');
  // }
  return (
    <>
      <Routes>
        <Route index element={<Welcome/>}/>
        <Route path="/home" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/create-account" element={<CreateUserAccount/>}/>
        <Route path="/loans" element={<Loans/>}/>
        <Route path="/history" element={<History/>}/>
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/transactions" element={<Transactions/>}/>
        {/* <Route path="/admin-actions" element={<AdminActions/>}/> */}
        <Route path="/more" element={<MoreActions/>}/>
        <Route path="/apply-products" element={<ApplyForProducts/>}/>
        <Route path="fund-account" element={<FundMyAccount/>} />
      </Routes>
      <NewTransactionForm/>
      <LoanRequestForm/>
      <NewAccountForm/>
    </>
  )
}

export default App

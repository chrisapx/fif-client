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
import MoreActions from "./client/pages/MoreActions"
import CreateUserAccount from "./client/components/forms/CreateUserAccount"
import FundMyAccount from "./client/pages/FundMyAccount"
import NewTransactionForm from "./client/components/forms/NewTransactionForm"
import AdminActions from "./admin/pages/AdminActions"
import ViewTransactions from "./admin/pages/ViewTransactions"
import ViewUsers from "./admin/pages/ViewUsers"
import ViewAcounts from "./admin/pages/ViewAcounts"
import NewAdminCreateAccountForm from "./admin/components/forms/NewAdminCreateAccountForm"
import NewAdminTransactionForm from "./admin/components/forms/NewAdminTransactionForm"

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
        <Route path="/more" element={<MoreActions/>}/>
        <Route path="/apply-products" element={<ApplyForProducts/>}/>
        <Route path="fund-account" element={<FundMyAccount/>} />

        {/* Admin routers */}
        <Route path="/admin-actions" element={<AdminActions/>}/>
        <Route path="/view-transactions" element={<ViewTransactions/>}/>
        <Route path="/view-users" element={<ViewUsers/>}/>
        <Route path="/view-accounts" element={<ViewAcounts/>}/>

      </Routes>
      <NewTransactionForm/>
      <LoanRequestForm/>
      <NewAccountForm/>
      <NewAdminCreateAccountForm/>
      <NewAdminTransactionForm/>
    </>
  )
}

export default App

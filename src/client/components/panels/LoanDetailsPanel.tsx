import { Sidebar } from 'primereact/sidebar';
import { useSearchParams } from 'react-router-dom';
import { searchParamsVariables } from '../../../utilities/UrlParamVariables';
import { decryptParams } from '../../../utilities/EncryptionHelper';
import { Logout05Icon } from 'hugeicons-react';

const LoanDetailsPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const panelStatus = searchParams.get(searchParamsVariables.loanDetailsPanelOpen);
  const loan: any = searchParams.get(searchParamsVariables.selectedLoan) !== null && decryptParams(searchParams.get(searchParamsVariables.selectedLoan));

  const handleHideLoanPanel = () => {
    searchParams.delete(searchParamsVariables.loanDetailsPanelOpen);
    searchParams.delete(searchParamsVariables.selectedLoan);
    setSearchParams(searchParams);
  };

  const handleOpenLoanRequestForm = () => {
    handleHideLoanPanel();
    searchParams.set(searchParamsVariables.loanRequestPanelOpen, '1');
    setSearchParams(searchParams);
  };

  const formatDueDate = (dateDispatched: Date, loanDuration: number) => {
    const dueDate = new Date(dateDispatched);
    dueDate.setMonth(dueDate.getMonth() + loanDuration);
    const day = dueDate.getDate();
    const month = dueDate.toLocaleString('en-US', { month: 'short' });
    const year = dueDate.getFullYear();
    const ordinal =
      day % 10 === 1 && day !== 11 ? 'st' :
      day % 10 === 2 && day !== 12 ? 'nd' :
      day % 10 === 3 && day !== 13 ? 'rd' : 'th';
    return `${day}${ordinal} ${month}, ${year}`;
  };

  const formatDate = (date: Date) => {
    return date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '--';
  };

  return (
    <div>
      <Sidebar
        visible={panelStatus === '1'}
        onHide={handleHideLoanPanel}
        className='w-full'
        content={({ hide }) => (
          <section className='overflow-y-auto'>
            <div className='fixed w-full top-0 right-0 left-0 flex justify-between items-center px-2 py-3 bg-blue-500 text-white'>
              <i className='pi pi-times' onClick={hide} />
              <p>Loan Details</p>
              <Logout05Icon />
            </div>

            <section className='mt-12 mb-16'>
              <div className='px-2 py-3'>
                <p className='text-xs'>Loan Name</p>
                <p className='text-sm'>{loan?.loanName || '--'}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Loan Amount</p>
                <p className='text-sm'>
                  <span className='text-[8px]'>UGX </span>{loan?.loanAmount?.toLocaleString() || '--'}
                </p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Loan Rate</p>
                <p className='text-sm'>{loan?.loanRate ? `${(loan.loanRate * 100).toFixed(1)}% [Reducing Balance - 4 Months]` : '--'}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Loan Group [SACCO]</p>
                <p className='text-sm'>{loan?.accGroup || '--'}</p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Amount Paid as on today</p>
                <p className='text-sm text-green-500'>
                  <span className='text-[8px]'>UGX </span>{loan?.amoundPaid?.toLocaleString() || '--'}
                </p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Amount Unpaid as of today</p>
                <p className='text-sm text-red-500'>
                  <span className='text-[8px]'>UGX </span>{loan?.amountUnPaid?.toLocaleString() || '--'}
                </p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Loan Status</p>
                <p className='text-sm underline font-bold'>{loan?.loanStatus?.replace("_", " ") || '--'}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Due Date</p>
                <p className='text-sm'>
                  {loan?.dateDispatched && loan?.loanDuration
                    ? formatDueDate(new Date(loan.dateDispatched), loan.loanDuration)
                    : '--'}
                </p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Requested On</p>
                <p className='text-sm'>{loan?.createdAt ? formatDate(new Date(loan.createdAt)) : '--'}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Last Updated On</p>
                <p className='text-sm'>{loan?.updatedAt ? formatDate(new Date(loan.updatedAt)) : '--'}</p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Loan Request Filed By</p>
                <p className='text-sm'>{loan?.requestedBy || '--'}</p>
              </div>
            </section>
            <div onClick={handleOpenLoanRequestForm} className='border-t border-gray-200 px-2 py-3 fixed bottom-0 left-0 right-0 w-full pb-4 bg-white'>
              <button className='text-[#115DA9] border-2 border-[#115DA9] px-4 py-2 rounded w-full'>+ Request New Loan</button>
            </div>
          </section>
        )}
      />
    </div>
  );
};

export default LoanDetailsPanel;
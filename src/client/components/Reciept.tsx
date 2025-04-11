import React from "react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface TicketProps {
  name: string;
  from: string;
  to: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  seat: string;
  ticketNumber: string;
  ticketType?: string;
  classType?: string;
  fareType?: string;
}

const Receipt: React.FC<TicketProps> = ({
  name,
  from,
  to,
  departureDate,
  arrivalDate,
  departureTime,
  arrivalTime,
  seat,
  ticketNumber,
  ticketType = "Oneway",
  classType = "First Class",
  fareType = "Adult",
}) => {
  const downloadPDF = () => {
    const input = document.getElementById("ticket");
    if (!input) return;

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("bus-ticket.pdf");
    });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md w-full max-w-3xl mx-auto">
      <div id="ticket" className="border border-gray-300 p-4 rounded-lg bg-gradient-to-r from-white via-blue-50 to-white">
        <div className="text-2xl font-bold text-gray-700 mb-2">International Bus Lines</div>
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <div>
            <div>Name: <span className="font-medium">{name}</span></div>
            <div>Ticket Type: {ticketType}</div>
          </div>
          <div>
            <div>Class: {classType}</div>
            <div>Fare: {fareType}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <div>From: <span className="font-medium">{from}</span></div>
            <div>Date: {departureDate}</div>
            <div>Time: {departureTime}</div>
          </div>
          <div>
            <div>To: <span className="font-medium">{to}</span></div>
            <div>Date: {arrivalDate}</div>
            <div>Time: {arrivalTime}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <div>Seat: <span className="text-xl font-bold">{seat}</span></div>
            <div>Ticket #: <span className="text-sm">{ticketNumber}</span></div>
          </div>
          <QRCode value={ticketNumber} size={80} />
        </div>
      </div>
      <button
        onClick={downloadPDF}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Download Ticket
      </button>
    </div>
  );
};

export default Receipt;

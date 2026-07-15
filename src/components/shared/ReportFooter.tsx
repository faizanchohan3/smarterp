const ReportFooter = () => {
  return (
    <div className="mt-8">
      {/* Terms and Conditions Section */}
      <div className="bg-gray-50 border-t-2 border-amber-100 p-6 sm:p-8 text-xs text-gray-700 leading-relaxed">
        <p className="mb-3 text-amber-900 font-semibold uppercase text-sm tracking-wide">Important Information</p>
        <ul className="space-y-2 text-gray-600">
          <li>• Rates are subject to change without notice</li>
          <li>• The company is not responsible for printing errors or omissions</li>
          <li>• All transactions are subject to the company's terms and conditions</li>
          <li>• For disputes or queries, please contact management</li>
          <li>• This report is generated electronically and is valid without signature</li>
        </ul>
      </div>

      {/* Bottom Footer Bar */}
      <div className="mt-4 space-y-2">
        <div className="h-2 bg-red-700"></div>
        <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-600"></div>
      </div>

      {/* Footer Text */}
      <div className="bg-gray-900 text-white p-4 text-center text-xs">
        <p className="mb-1">
          © {new Date().getFullYear()} All Rights Reserved | Powered by SmartERP
        </p>
        <p className="text-gray-400">
          Generated: {new Date().toLocaleString("en-PK")}
        </p>
      </div>
    </div>
  );
};

export default ReportFooter;

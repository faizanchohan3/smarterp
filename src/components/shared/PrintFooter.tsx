const PrintFooter = () => (
  <div className="hidden print:block mt-16 print-receipt-footer print-branding">
    <div className="flex justify-end">
      <div className="text-center">
        <div className="w-56 border-t-2 pt-1" style={{ borderColor: "#b8860b" }}>
          <p className="text-xs font-semibold" style={{ color: "#7a5a10" }}>Authorized Signature</p>
        </div>
      </div>
    </div>
  </div>
);

export default PrintFooter;

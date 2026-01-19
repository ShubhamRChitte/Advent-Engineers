import { useLocation, useNavigate } from "react-router-dom";
import "./OrderForm.css";

const OrderForm = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  return (
    <div className="order-form-container">

      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back to List
      </button>

      <h2>Order Form - Transformer Details</h2>
      <p>Complete all required information for the order</p>

      {/* Selected Transformer */}
      <div className="selected-box">
        <h4>Selected Transformer</h4>
        <b>{state?.name}</b>
        <p>
          Type: {state?.type} • Capacity: {state?.capacity} • Voltage:{" "}
          {state?.voltage}
        </p>
      </div>

      {/* Client Details */}
      <h3>Client Details</h3>
      <div className="two-col">
        <input placeholder="Client Name *" />
        <input placeholder="Client Contact Number *" />
      </div>

      {/* Order Details */}
      <h3>Order Details</h3>
      <div className="two-col">
        <input defaultValue="1" placeholder="Quantity *" />
        <input placeholder="IS Standard (IS 2705 / IS 3156)" />
        <input defaultValue={state?.cores} placeholder="Number of Cores *" />
      </div>

      {/* Core Configuration */}
      <h3>Core Configuration</h3>
      <div className="three-col">
        <select>
    <option value="">Select Core Type</option>
    <option value="metering">Metering</option>
    <option value="protection">Protection</option>
    <option value="metering-protection">Metering + Protection</option>
    <option value="spare">Spare</option>
     </select>

     <select>
    <option value="">Select Core Type</option>
    <option value="metering">Metering</option>
    <option value="protection">Protection</option>
    <option value="metering-protection">Metering + Protection</option>
    <option value="spare">Spare</option>
     </select>

     <select>
    <option value="">Select Core Type</option>
    <option value="metering">Metering</option>
    <option value="protection">Protection</option>
    <option value="metering-protection">Metering + Protection</option>
    <option value="spare">Spare</option>
     </select>

      </div>

      {/* Transformer Parameters */}
      <h3>Transformer Parameters</h3>
      <div className="two-col">
        <input placeholder="Nominal System Voltage (e.g. 33 kV)" />
        <input placeholder="Burden (e.g. 15 VA)" />
        <input placeholder="Rated Primary Current (e.g. 200 A)" />
        <input placeholder="Rated Secondary Current (1A / 5A)" />
        <input placeholder="Accuracy Class (0.2S / 5P20)" />
        <input placeholder="Mounting Details" />
      </div>

      <input
        className="full-width"
        placeholder="Overall Dimensions (e.g. 500 x 300 x 400 mm)"
      />

      {/* Upload */}
      <h3>Upload Image</h3>
      <div className="upload-box">
        Click to upload or drag & drop (PNG, JPG, PDF up to 10MB)
      </div>

      {/* Actions */}
      <div className="actions">
        <button className="cancel-btn">Cancel</button>
        <button className="continue-btn">Continue to Assign Testing</button>
      </div>
    </div>
  );
};

export default OrderForm;

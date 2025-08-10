import { useState } from "react";

export default function CreateUser() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    nin: "",
    nextOfKin: "",
    username: "",
    pin: "",
    address: {
      city: "",
      country: "",
      street: "",
      zip: "",
      description: ""
    },
    active: true
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log("Submitting:", formData);
    // fetch("/api/users", { method: "POST", body: JSON.stringify(formData) })
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Create New User</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {/* Basic Info */}
        <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="input" required />
        <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="input" required />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="input" required />
        <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="input" required />
        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input" />
        <select name="gender" value={formData.gender} onChange={handleChange} className="input" required>
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
        <input name="nin" placeholder="NIN" value={formData.nin} onChange={handleChange} className="input" />
        <input name="nextOfKin" placeholder="Next of Kin" value={formData.nextOfKin} onChange={handleChange} className="input" />
        <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} className="input" />
        <input type="password" name="pin" placeholder="PIN" value={formData.pin} onChange={handleChange} className="input" />

        {/* Address */}
        <input name="address.city" placeholder="City" value={formData.address.city} onChange={handleChange} className="input" />
        <input name="address.country" placeholder="Country" value={formData.address.country} onChange={handleChange} className="input" />
        <input name="address.street" placeholder="Street" value={formData.address.street} onChange={handleChange} className="input" />
        <input name="address.zip" placeholder="ZIP Code" value={formData.address.zip} onChange={handleChange} className="input" />
        <textarea name="address.description" placeholder="Address Description" value={formData.address.description} onChange={handleChange} className="input col-span-2" />

        {/* Active Toggle */}
        <label className="flex items-center gap-2 col-span-2">
          <input type="checkbox" checked={formData.active} onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))} />
          Active
        </label>

        {/* Submit */}
        <div className="col-span-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Create User
          </button>
        </div>
      </form>

      {/* Tailwind Input Styles */}
      {/* <style jsx>{`
        .input {
          border: 1px solid #ccc;
          border-radius: 0.5rem;
          padding: 0.5rem;
          width: 100%;
        }
      `}</style> */}
    </div>
  );
}

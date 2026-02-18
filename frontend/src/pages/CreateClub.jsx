import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiHome, FiArrowLeft, FiPlus, FiUsers } from "react-icons/fi";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function CreateClub() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    president_name: "",
    president_email: "",
    president_password: "",
    secretary_name: "",
    secretary_email: "",
    secretary_password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/clubs/create", formData);
      if (res.data.success) {
        setSuccess("Club and admin members created successfully!");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setError(res.data.message || "Failed to create club");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="absolute top-4 left-4 flex gap-2">
        <Button
          variant="ghost"
          icon={FiArrowLeft}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <Button
          variant="ghost"
          icon={FiHome}
          onClick={() => navigate("/")}
        >
          Home
        </Button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create a New Club</h2>
          <p className="text-gray-600 mt-2">
            This is for authority use only.
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError("")} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Club Info */}
          <fieldset className="border rounded-lg p-4">
            <legend className="text-lg font-semibold mb-2 text-green-700 px-2">Club Details</legend>
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Club Name"
                onChange={handleChange}
                value={formData.name}
                className="w-full p-3 border rounded-lg"
                required
              />
              <textarea
                name="description"
                placeholder="Club Description"
                onChange={handleChange}
                value={formData.description}
                className="w-full p-3 border rounded-lg"
                rows="3"
                required
              ></textarea>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* President Info */}
            <fieldset className="border rounded-lg p-4">
              <legend className="text-lg font-semibold mb-2 text-green-700 px-2">President Info</legend>
              <div className="space-y-4">
                <input
                  type="text"
                  name="president_name"
                  placeholder="President Name"
                  onChange={handleChange}
                  value={formData.president_name}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="email"
                  name="president_email"
                  placeholder="President Email"
                  onChange={handleChange}
                  value={formData.president_email}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="password"
                  name="president_password"
                  placeholder="President Password"
                  onChange={handleChange}
                  value={formData.president_password}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
            </fieldset>

            {/* Secretary Info */}
            <fieldset className="border rounded-lg p-4">
              <legend className="text-lg font-semibold mb-2 text-green-700 px-2">Secretary Info</legend>
              <div className="space-y-4">
                <input
                  type="text"
                  name="secretary_name"
                  placeholder="Secretary Name"
                  onChange={handleChange}
                  value={formData.secretary_name}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="email"
                  name="secretary_email"
                  placeholder="Secretary Email"
                  onChange={handleChange}
                  value={formData.secretary_email}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="password"
                  name="secretary_password"
                  placeholder="Secretary Password"
                  onChange={handleChange}
                  value={formData.secretary_password}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
            </fieldset>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={FiPlus}
          >
            {loading ? "Creating Club..." : "Create Club"}
          </Button>
        </form>
      </div>
    </div>
  );
}
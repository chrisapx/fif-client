import Header from "../components/Header";
import BottomNavigationTabs from "../components/BottomNavigationTabs";
import { getAuthUser } from "../../utilities/AuthCookieManager";

const user = getAuthUser();

const Profile = () => {

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="pt-14 flex-1 flex items-center justify-center text-gray-500">
          No profile information found.
        </div>
        <BottomNavigationTabs />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="pt-14 px-3 flex-1 bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
              {user.firstName?.charAt(0)}
              {user.lastName?.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-500">+{user.phone}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Username</p>
              <p className="font-medium text-gray-800">{user.username}</p>
            </div>
            <div>
              <p className="text-gray-500">Gender</p>
              <p className="font-medium text-gray-800">{user.gender}</p>
            </div>
            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="font-medium text-gray-800">{user.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-gray-500">NIN</p>
              <p className="font-medium text-gray-800">{user.nin}</p>
            </div>
            <div>
              <p className="text-gray-500">Active</p>
              <p
                className={`font-medium ${
                  user.active ? "text-green-600" : "text-red-600"
                }`}
              >
                {user.active ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Role</p>
              <p className="font-medium text-gray-800">
                {user.roles?.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-gray-500">ID Code</p>
              <p className="font-medium text-gray-800">{user.userId}</p>
            </div>
            <div>
              <p className="text-gray-500">Created On</p>
              <p className="font-medium text-gray-800">
                {new Date(user.createdAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default Profile;
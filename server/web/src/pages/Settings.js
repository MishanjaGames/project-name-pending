import { Navbar } from "../components/Navbar";

function Settings({data, onLogout}) {
    return (
        <>
            <div className="d-flex flex-column flex-lg-row min-vh-100 bg-light">
                <Navbar data={data} onLogout={onLogout} />
                <div>
                    <h3>Settings</h3>
                </div>
            </div>
        </>
    )
}

export default Settings;

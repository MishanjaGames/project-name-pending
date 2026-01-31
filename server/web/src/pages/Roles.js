import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";

function Roles({data, onLogout}) {
    const [roles, setRoles] = useState([])

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            const fetchUsers = async () => {
                try {
                    const response = await fetch('http://localhost:4040/api/manage/roles', {
                        method: 'GET',
                        headers: {
                            'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const res = await response.json();
                        setRoles(res.data);
                    }
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            };

            fetchUsers();
        }
    }, []);

    return (
        <>
            <div className="d-flex flex-column flex-lg-row min-vh-100 bg-light">
                <Navbar data={data} onLogout={onLogout} />
                <div>
                    <h3>Roles list</h3>
                    <ul>
                        {
                            roles.length > 0 ?
                                roles.map((r, index) => (
                                    <li key={index}>{index + 1}. {r.name} - {r.accessLevel}</li>
                                ))
                                : <p>Table is Empty</p>
                        }
                    </ul>
                </div>
            </div>
        </>
    )
}
export default Roles;
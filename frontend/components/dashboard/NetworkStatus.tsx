import {
    CheckCircle,
    AlertCircle,
} from "lucide-react";

const networks = [
    {
        name: "MTN",
        status: true,
    },
    {
        name: "Airtel",
        status: true,
    },
    {
        name: "Glo",
        status: true,
    },
    {
        name: "9mobile",
        status: false,
    },
];

export default function NetworkStatus() {
    return (
        <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="font-bold text-xl mb-5">
                Network Status
            </h2>

            <div className="space-y-4">

                {networks.map((network) => (

                    <div
                        key={network.name}
                        className="flex justify-between"
                    >

                        <span>{network.name}</span>

                        {network.status ? (

                            <span className="flex items-center gap-2 text-green-600">

                                <CheckCircle size={18} />

                                Online

                            </span>

                        ) : (

                            <span className="flex items-center gap-2 text-yellow-600">

                                <AlertCircle size={18} />

                                Slow

                            </span>

                        )}

                    </div>

                ))}

            </div>

        </div>
    );
}
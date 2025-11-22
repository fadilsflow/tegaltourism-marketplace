import { AdForm } from "@/components/admin/ad-form";

export default function NewAdPage() {
    return (
        <div className="container mx-auto py-10 px-6 md:px-12">
            <h1 className="text-2xl font-bold mb-6">Create New Ad</h1>
            <AdForm />
        </div>
    );
}

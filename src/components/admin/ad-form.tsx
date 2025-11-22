

"use client";

import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdSchema } from "@/lib/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { createAd, updateAd } from "@/actions/ads";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface AdFormProps {
    initialData?: z.infer<typeof createAdSchema> & { id: string };
    adId?: string;
}

export function AdForm({ initialData, adId }: AdFormProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof createAdSchema>>({
        resolver: zodResolver(createAdSchema) as Resolver<z.infer<typeof createAdSchema>>,
        defaultValues: initialData
            ? {
                ...initialData,
                startDate: new Date(initialData.startDate),
                endDate: new Date(initialData.endDate),
                quota: initialData.quota ?? undefined,
            }
            : {
                title: "",
                description: "",
                imageUrl: "",
                targetUrl: "",
                rewardCoin: 0,
                startDate: new Date(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default 1 week
                quota: undefined,
                status: "draft",
                sortOrder: 0,
            },
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof createAdSchema>) => {
            if (isEditing && adId) {
                return updateAd(adId, values);
            } else {
                return createAd(values);
            }
        },
        onSuccess: () => {
            toast.success(isEditing ? "Ad updated" : "Ad created");
            // Invalidate the query to ensure the list is updated when navigating back
            queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
            router.push("/admin/ads");
            router.refresh();
        },
        onError: (error) => {
            toast.error("Something went wrong");
            console.error(error);
        },
    });

    function onSubmit(values: z.infer<typeof createAdSchema>) {
        mutation.mutate(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Image</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    label="Ad Image"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ad title" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="targetUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Target URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="rewardCoin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reward (Coins)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        value={field.value && !isNaN(new Date(field.value).getTime()) ? format(field.value, "yyyy-MM-dd") : ""}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : undefined;
                                            field.onChange(date);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        value={field.value && !isNaN(new Date(field.value).getTime()) ? format(field.value, "yyyy-MM-dd") : ""}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : undefined;
                                            field.onChange(date);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="quota"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quota (Optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value ? parseInt(e.target.value) : null
                                            )
                                        }
                                    />
                                </FormControl>
                                <FormDescription>
                                    Leave empty for unlimited.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="sortOrder"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sort Order</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Higher numbers appear first.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ad description" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : isEditing ? "Update Ad" : "Create Ad"}
                </Button>
            </form>
        </Form>
    );
}

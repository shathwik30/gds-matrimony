"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, Package, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CONTACT_PACKS } from "@/constants";
import { getContactPackBalance } from "@/lib/actions/contact-packs";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";

import { loadRazorpayScript, verifyRazorpayPayment, type RazorpayOptions } from "@/lib/razorpay";

export default function ContactPacksPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [processingPack, setProcessingPack] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(0);

  useEffect(() => {
    loadBalance();
    loadRazorpayScript();
  }, []);

  const loadBalance = async () => {
    try {
      const result = await getContactPackBalance();
      if (result.success && result.data !== undefined) {
        setCurrentBalance(result.data);
      }
    } catch (error) {
      console.error("Failed to load balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchasePack = async (packId: string) => {
    if (typeof window.Razorpay !== "function") {
      toast.error("Payment system is loading. Please try again in a moment.");
      return;
    }

    setProcessingPack(packId);

    try {
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseType: packId }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const orderData = await orderResponse.json();

      const pack = CONTACT_PACKS.find((p) => p.id === packId);
      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "GDS Marriage Links",
        description: pack?.description || "Contact Pack Purchase",
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verifyData = await verifyRazorpayPayment(response);
            toast.success(verifyData.message || "Contact pack purchased successfully!");
            await loadBalance();
            router.refresh();
          } catch (error) {
            console.error("Verification error:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || "",
        },
        theme: {
          color: "#C00F0C",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to initiate payment");
    } finally {
      setProcessingPack(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container-wide px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 text-center sm:mb-10 md:mb-12">
        <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
          Contact Packs
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl px-2 text-sm sm:text-base">
          Purchase contact packs to view phone numbers and email addresses of profiles that interest
          you. Perfect for when you need extra connections beyond your subscription.
        </p>
        <div className="mt-4 sm:mt-6">
          <Badge variant="secondary" className="px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-lg">
            <Phone className="mr-2 h-4 w-4" />
            Current Balance: {currentBalance} contacts
          </Badge>
        </div>
      </div>

      <div className="mx-auto mb-8 grid max-w-5xl grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-2 sm:gap-6 md:mb-12 md:grid-cols-3">
        {CONTACT_PACKS.map((pack, index) => {
          const isPopular = index === 1; // Value Pack

          return (
            <Card
              key={pack.id}
              variant={isPopular ? "elevated" : "default"}
              className={`animate-fade-in-up relative stagger-${index + 1} ${
                isPopular ? "border-brand shadow-premium-xl border-2 lg:scale-105" : ""
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Best Value
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2 text-center">
                <div
                  className={`shadow-premium-sm mx-auto mb-2 rounded-full p-4 ${
                    index === 0
                      ? "bg-blue-100 text-blue-600"
                      : index === 1
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-purple-100 text-purple-600"
                  }`}
                >
                  <Package className="h-6 w-6" />
                </div>
                <CardTitle>{pack.name}</CardTitle>
                <CardDescription>
                  <span className="text-foreground text-3xl font-bold">
                    {formatCurrency(pack.price)}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-brand mb-1 text-2xl font-bold">{pack.size} Contacts</div>
                  <div className="text-muted-foreground text-sm">
                    ₹{pack.pricePerContact.toFixed(2)} per contact
                  </div>
                  {pack.savings && (
                    <Badge variant="secondary" className="mt-2">
                      Save {pack.savings}
                    </Badge>
                  )}
                </div>

                <div className="border-t pt-3">
                  <p className="text-muted-foreground text-center text-sm">{pack.description}</p>
                </div>

                <ul className="space-y-2 pt-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>View phone numbers</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>View email addresses</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>No expiry date</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Use anytime</span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handlePurchasePack(pack.id)}
                  disabled={!!processingPack}
                >
                  {processingPack === pack.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Purchase Now"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-10 md:mt-12">
        <h2 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">How Contact Packs Work</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="p-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="mb-2 font-medium">Purchase Pack</h3>
            <p className="text-muted-foreground text-sm">
              Choose a contact pack that suits your needs and complete the payment.
            </p>
          </div>
          <div className="p-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="mb-2 font-medium">View Profiles</h3>
            <p className="text-muted-foreground text-sm">
              Browse profiles and when you find someone interesting, use a contact to reveal their
              details.
            </p>
          </div>
          <div className="p-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="mb-2 font-medium">Connect Directly</h3>
            <p className="text-muted-foreground text-sm">
              Get their phone number and email to connect directly and take the conversation
              forward.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

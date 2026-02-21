"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, Package, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    // Check Razorpay availability BEFORE creating the order
    if (typeof window.Razorpay !== "function") {
      toast.error("Payment system is loading. Please try again in a moment.");
      return;
    }

    setProcessingPack(packId);

    try {
      // Create order
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

      // Open Razorpay
      const pack = CONTACT_PACKS.find(p => p.id === packId);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="container-wide py-6 sm:py-8 px-4 sm:px-6">
      <div className="text-center mb-8 sm:mb-10 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2">Contact Packs</h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
          Purchase contact packs to view phone numbers and email addresses of profiles that interest you.
          Perfect for when you need extra connections beyond your subscription.
        </p>
        <div className="mt-4 sm:mt-6">
          <Badge variant="secondary" className="text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2">
            <Phone className="h-4 w-4 mr-2" />
            Current Balance: {currentBalance} contacts
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto mb-8 sm:mb-10 md:mb-12">
        {CONTACT_PACKS.map((pack, index) => {
          const isPopular = index === 1; // Value Pack

          return (
            <Card
              key={pack.id}
              variant={isPopular ? "elevated" : "default"}
              className={`relative animate-fade-in-up stagger-${index + 1} ${
                isPopular ? "border-2 border-brand shadow-premium-xl md:scale-105" : ""
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className={`mx-auto mb-2 p-4 rounded-full shadow-premium-sm ${
                  index === 0
                    ? "bg-blue-100 text-blue-600"
                    : index === 1
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-purple-100 text-purple-600"
                }`}>
                  <Package className="h-6 w-6" />
                </div>
                <CardTitle>{pack.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    {formatCurrency(pack.price)}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand mb-1">
                    {pack.size} Contacts
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ₹{pack.pricePerContact.toFixed(2)} per contact
                  </div>
                  {pack.savings && (
                    <Badge variant="secondary" className="mt-2">
                      Save {pack.savings}
                    </Badge>
                  )}
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    {pack.description}
                  </p>
                </div>

                <ul className="space-y-2 pt-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>View phone numbers</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>View email addresses</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>No expiry date</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
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

      <div className="mt-8 sm:mt-10 md:mt-12 text-center max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">How Contact Packs Work</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="p-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-medium mb-2">Purchase Pack</h3>
            <p className="text-sm text-muted-foreground">
              Choose a contact pack that suits your needs and complete the payment.
            </p>
          </div>
          <div className="p-4">
            <div className="h-12 w-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-medium mb-2">View Profiles</h3>
            <p className="text-sm text-muted-foreground">
              Browse profiles and when you find someone interesting, use a contact to reveal their details.
            </p>
          </div>
          <div className="p-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-medium mb-2">Connect Directly</h3>
            <p className="text-sm text-muted-foreground">
              Get their phone number and email to connect directly and take the conversation forward.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

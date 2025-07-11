'use server'
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { handleError } from "../utils";
import { connectToDatabase } from "../database/mongoose";
import Transaction from "../database/models/transaction.model";
import { BugPlay } from "lucide-react";
import { updateCredits } from "./user.actions";
export async function checkoutCredits(transaction:CheckoutTransactionParams){
    const stripe =new Stripe (process.env.STRIPE_SECRET_KEY!);
    const amount =Number(transaction.amount) * 100;

    const session=await stripe.checkout.sessions.create({
        line_items:[{
            price_data:{
                currency:'usd',
                product_data:{
                    name:transaction.plan
                   
                },
                unit_amount:amount,
            },
            quantity:1, 
        }],
        metadata:{
            plan:transaction.plan,
            credits:transaction.credits,
            buyerId:transaction.buyerId
        },
        mode:'payment',
        success_url:`${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
        cancel_url:`${process.env.NEXT_PUBLIC_SERVER_URL}/`,
    })

    redirect(session.url!);
}

export async function createTransaction(transaction:CreateTransactionParams){
    try{
        await connectToDatabase();

        const newTransaction = await Transaction.create({
          ...transaction,
          buyerId: transaction.buyerId,
        })
        await updateCredits(transaction.buyerId, transaction.credits);
        return JSON.parse(JSON.stringify(newTransaction));
    }catch(error){
        handleError(error)}
}
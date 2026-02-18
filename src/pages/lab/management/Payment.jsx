import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle, XCircle, ArrowLeft, Building2 } from 'lucide-react'
import Button from '../../../components/labManagement/Button'
import Card from '../../../components/labManagement/Card'
import toast from 'react-hot-toast'
import { formatCurrencyINR } from '../../../utils/currency'

const REGISTRATION_FEE = 5000

export default function Payment() {
    const navigate = useNavigate()
    const location = useLocation()
    const organizationId = location.state?.organizationId
    const organizationName = location.state?.organizationName || 'Your Laboratory'

    const [paymentMethod, setPaymentMethod] = useState('debit_card')
    const [processing, setProcessing] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState(null) // 'success' or 'failed'

    const paymentMethods = [
        { id: 'debit_card', name: 'Debit Card', icon: CreditCard },
        { id: 'credit_card', name: 'Credit Card', icon: CreditCard },
        { id: 'net_banking', name: 'Net Banking / NEFT / RTGS', icon: Building2 },
        { id: 'upi', name: 'UPI / Wallets', icon: CreditCard },
    ]

    const handlePayment = async () => {
        if (!organizationId) {
            toast.error('Organization ID not found. Please go back and try again.')
            return
        }

        setProcessing(true)

        // Simulate payment processing
        setTimeout(() => {
            // Mock payment success (90% success rate)
            const isSuccess = Math.random() > 0.1

            setPaymentStatus(isSuccess ? 'success' : 'failed')
            setProcessing(false)

            if (isSuccess) {
                toast.success('Payment successful!')
            } else {
                toast.error('Payment failed. Please try again.')
            }
        }, 3000)
    }

    if (paymentStatus === 'success') {
        return (
            <div className="flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full"
                >
                    <Card className="text-center p-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 mb-6">
                            Your laboratory registration payment has been processed successfully.
                        </p>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Organization:</span>
                                <span className="font-semibold">{organizationName}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Amount Paid:</span>
                                <span className="font-semibold">{formatCurrencyINR(REGISTRATION_FEE)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Method:</span>
                                <span className="font-semibold capitalize">{paymentMethod.replace('_', ' ')}</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => navigate('/lab/management/organization')}
                            className="w-full"
                        >
                            Back to Dashboard
                        </Button>
                    </Card>
                </motion.div>
            </div>
        )
    }

    if (paymentStatus === 'failed') {
        return (
            <div className="flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full"
                >
                    <Card className="text-center p-8">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                        <p className="text-gray-600 mb-6">
                            We couldn't process your payment. Please try again or contact support.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/lab/management/organization')}
                                className="flex-1"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Go Back
                            </Button>
                            <Button
                                onClick={() => setPaymentStatus(null)}
                                className="flex-1"
                            >
                                Try Again
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
                        <p className="text-gray-600 mt-2">Laboratory Registration Fee</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/lab/management/organization')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Payment Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <div className="border-b border-gray-200 pb-4 mb-6">
                                <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
                                <p className="text-gray-600 mt-1">Laboratory Registration Fee</p>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Select Payment Method
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {paymentMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${paymentMethod === method.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <method.icon className={`w-5 h-5 ${paymentMethod === method.id ? 'text-primary' : 'text-gray-400'
                                                }`} />
                                            <span className={`font-medium ${paymentMethod === method.id ? 'text-primary' : 'text-gray-700'
                                                }`}>
                                                {method.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mock Payment Notice */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> This is a demo payment system. In production, this will integrate with Bill Desk Payment Gateway for secure transactions.
                                </p>
                            </div>

                            {/* Payment Button */}
                            <Button
                                onClick={handlePayment}
                                disabled={processing}
                                className="w-full"
                                size="lg"
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Processing Payment...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5 mr-2" />
                                        Pay {formatCurrencyINR(REGISTRATION_FEE)}
                                    </>
                                )}
                            </Button>
                        </Card>
                    </div>

                    {/* Payment Summary */}
                    <div className="lg:col-span-1">
                        <Card>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Organization:</span>
                                    <span className="font-medium text-gray-900">{organizationName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Registration Fee:</span>
                                    <span className="font-medium text-gray-900">{formatCurrencyINR(REGISTRATION_FEE)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Processing Fee:</span>
                                    <span className="font-medium text-gray-900">{formatCurrencyINR(0)}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-3">
                                <div className="flex justify-between">
                                    <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                                    <span className="text-xl font-bold text-primary">{formatCurrencyINR(REGISTRATION_FEE)}</span>
                                </div>
                            </div>

                            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600">
                                    By proceeding with the payment, you agree to our terms and conditions.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

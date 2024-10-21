const { Orders } = require('../models/orders');
const express = require('express');
const router = express.Router();



router.get(`/`, async (req, res) => {

    try {
    

        const ordersList = await Orders.find(req.query)


        if (!ordersList) {
            res.status(500).json({ success: false })
        }

        return res.status(200).json(ordersList);

    } catch (error) {
        res.status(500).json({ success: false })
    }


});


router.get('/:id', async (req, res) => {

    const order = await Orders.findById(req.params.id);

    if (!order) {
        res.status(500).json({ message: 'The order with the given ID was not found.' })
    }
    return res.status(200).send(order);
})

router.get(`/get/count`, async (req, res) =>{
    const orderCount = await Orders.countDocuments()

    if(!orderCount) {
        res.status(500).json({success: false})
    } else{
        res.send({
            orderCount: orderCount
        });
    }
   
})



router.post('/create', async (req, res) => {

    let order = new Orders({
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        pincode: req.body.pincode,
        amount: req.body.amount,
        paymentId: req.body.paymentId,
        email: req.body.email,
        userid: req.body.userid,
        products: req.body.products,
        date:req.body.date
    });

    let order1 = {
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        pincode: req.body.pincode,
        amount: req.body.amount,
        paymentId: req.body.paymentId,
        email: req.body.email,
        userid: req.body.userid,
        products: req.body.products,
        date:req.body.date
    };

    console.log(order1)



    if (!order) {
        res.status(500).json({
            error: err,
            success: false
        })
    }


    order = await order.save();


    res.status(201).json(order);

});


router.delete('/:id', async (req, res) => {

    const deletedOrder = await Orders.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
        res.status(404).json({
            message: 'Order not found!',
            success: false
        })
    }

    res.status(200).json({
        success: true,
        message: 'Order Deleted!'
    })
});


router.put('/:id', async (req, res) => {

    const order = await Orders.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            pincode: req.body.pincode,
            amount: req.body.amount,
            paymentId: req.body.paymentId,
            email: req.body.email,
            userid: req.body.userid,
            products: req.body.products,
            status:req.body.status
        },
        { new: true }
    )



    if (!order) {
        return res.status(500).json({
            message: 'Order cannot be updated!',
            success: false
        })
    }

    res.send(order);

})

router.put('/cancel/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Orders.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status === "Delivered" || order.status === "Returned" || order.status === "Refunded") {
            return res.status(400).json({ message: "Cannot cancel this order" });
        }

        order.request = "Cancel order";
        await order.save();

        res.status(200).json({ message: "Order canceled successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Error canceling order", error });
    }
});

// Request a return for an order
router.put('/return/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Orders.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status !== "Delivered") {
            return res.status(400).json({ message: "Only delivered orders can be returned" });
        }

        order.status = "Return Requested";
        await order.save();

        res.status(200).json({ message: "Return request successful", order });
    } catch (error) {
        res.status(500).json({ message: "Error requesting return", error });
    }
});

// Request a refund for an order
router.put('/refund/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Orders.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status !== "Returned") {
            return res.status(400).json({ message: "Only returned orders can be refunded" });
        }

        order.status = "Refund Requested";
        await order.save();

        res.status(200).json({ message: "Refund request successful", order });
    } catch (error) {
        res.status(500).json({ message: "Error requesting refund", error });
    }
});

module.exports = router;


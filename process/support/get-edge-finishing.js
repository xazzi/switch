getEdgeFinishing = function(orderArray){
    return edge = {
        top:{
            type: orderArray.pocket.side.top ? "Pocket" : orderArray.hem.side.top ? "Hem" : "None",
            size: orderArray.pocket.side.top ? orderArray.pocket.size.top : orderArray.hem.side.top ? 1.125 : 0,
            allowance: orderArray.pocket.side.top ? Number(orderArray.pocket.size.top) + 1 : orderArray.hem.side.top ? 1.125 : 0
        },
        bottom:{
            type: orderArray.pocket.side.bottom ? "Pocket" : orderArray.hem.side.bottom ? "Hem" : "None",
            size: orderArray.pocket.side.bottom ? orderArray.pocket.size.bottom : orderArray.hem.side.bottom ? 1.125 : 0,
            allowance: orderArray.pocket.side.bottom ? Number(orderArray.pocket.size.bottom) + 1 : orderArray.hem.side.bottom ? 1.125 : 0
        },
        left:{
            type: orderArray.pocket.side.left ? "Pocket" : orderArray.hem.side.left ? "Hem" : "None",
            size: orderArray.pocket.side.left ? orderArray.pocket.size.left : orderArray.hem.side.left ? 1.125 : 0,
            allowance: orderArray.pocket.side.left ? Number(orderArray.pocket.size.left) + 1 : orderArray.hem.side.left ? 1.125 : 0
        },
        right:{
            type: orderArray.pocket.side.right ? "Pocket" : orderArray.hem.side.right ? "Hem" : "None",
            size: orderArray.pocket.side.right ? orderArray.pocket.size.right : orderArray.hem.side.right ? 1.125 : 0,
            allowance: orderArray.pocket.side.right ? Number(orderArray.pocket.size.right) + 1 : orderArray.hem.side.right ? 1.125 : 0
        }
    }
}
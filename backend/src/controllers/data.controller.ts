import { purchaseData } from "../services/data.service";
import { vtpassProvider } from "../providers/vtpass/vtpass.provider";


export const buyData = async (req: any, res: any) => {

  try {


    console.log("DATA CONTROLLER REACHED");
    console.log("USER:", req.user);


    const userId = req.user;


    console.log(
      "DATA PURCHASE USER ID:",
      userId
    );


    const {
      network,
      phone,
      plan,
      amount,
    } = req.body;



    console.log(
      "DATA REQUEST BODY:",
      {
        network,
        phone,
        plan,
        amount,
      }
    );



    if (!network || !phone || !plan || !amount) {

      return res.status(400).json({

        success:false,

        message:"All fields are required"

      });

    }



    const result = await purchaseData({

      userId,

      network,

      phone,

      plan,

      amount:Number(amount),

    });



    return res.status(200).json(result);



  } catch(error:any) {


    console.log(
      "DATA PURCHASE ERROR:",
      error.message
    );


    return res.status(
      error.statusCode || 400
    ).json({

      success:false,

      message:error.message

    });


  }

};





export const getDataPlans = async (
  req:any,
  res:any
) => {


  try {


    const { network } = req.params;


    if(!network){

      return res.status(400).json({

        success:false,

        message:"Network is required"

      });

    }



    const result =
      await vtpassProvider.getDataPlans(
        network
      );



    return res.status(200).json(result);



  } catch(error:any) {


    return res.status(400).json({

      success:false,

      message:error.message

    });


  }

};
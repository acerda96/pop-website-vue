import express from "express";
import Item from "../models/ItemModel";
import Store from "../models/StoreModel";
import verifyToken from "../utils/verifyToken";
import Joi from "@hapi/joi";
import upload from "../utils/multer-upload";

const RESULTS_PER_PAGE = 10;

const searchSchema = Joi.object({
  sortCriterion: Joi.number(),
  page: Joi.number(),
  size: Joi.number(),
  storeId: Joi.string(),
});

const router = express.Router();

//@routes GET api/items/:id
//@desc Get item by id
router.get("/:id", (req, res) => {
  Item.findById(req.params.id)
    .then((item) => {
      res.status(200).json(item);
    })
    .catch(() => {
      res.status(404).json({ error: "Item could not be found" });
    });
});

//@routes POST api/items
//@desc Add an item
router.post("/", verifyToken, upload.array("images", 4), (req, res) => {
  Store.findById(req.body.storeId)
    .then((store:any) => {
      console.log("AFTER FILE", req.files);
      if (store.userId !== req.user.id)
        res.status(401).json({ error: "Unauthorized" });
      else {
        const newItem = new Item({
          ...req.body,
          userId: req.user.id,
          currentQuantity: req.body.initialQuantity,
          images: req.files,
        });
        newItem
          .save()
          .then((item) => {
            res.status(201).json(item);
          })
          .catch(() => {
            res.status(400).json({ error: "Item could not be added" });
          });
      }
    })
    .catch(() => res.status(400).json({ error: "Store could not be found" }));
});

//@routes POST api/items
//@desc Add an item
router.post(
  "/upload/new",
  verifyToken,
  upload.array("images", 4),
  (req, res) => {
    Store.findById(req.body.storeId)
      .then((store:any) => {
        console.log(req.user.id);
        console.log(store.userId);
        if (store.userId !== req.user.id)
          res.status(401).json({ error: "Unauthorized" });
        else {
          const newItem = new Item({
            ...req.body,
            userId: req.user.id,
            currentQuantity: req.body.initialQuantity,
            images: req.files,
          });
          newItem
            .save()
            .then((item) => {
              res.status(201).json(item);
            })
            .catch(() => {
              res.status(400).json({ error: "Item could not be added" });
            });
        }
      })
      .catch(() => res.status(400).json({ error: "Store could not be found" }));
  }
);

//@routes DELETE api/items
//@desc Delete an item
router.delete("/:id", verifyToken, (req, res) => {
  Item.findById(req.params.id)
    .then((item:any) => {
      if (item.userId === req.user.id) {
        item.delete();
        res.status(204).send();
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    })
    .catch(() => {
      res.status(404).json({ error: "Item could not be found" });
    });
});

//@routes POST api/items
//@desc Get items
router.get("/", async (req, res) => {
  const { error } = searchSchema.validate(req.query);

  if (error && error.details[0].message) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const sortCriterion : number = Number(req.query.sortCriterion);
  const page = Number(req.query.page) || 0;
  const size = Number(req.query.size) || RESULTS_PER_PAGE;

  const sortTerm = {}
  sortCriterion === 1 ? sortTerm["unitPrice"] = 1 : sortTerm["$natural"] = -1

  try {
    const items = await Item.find()
    .sort(sortTerm)
    .skip(RESULTS_PER_PAGE * page)
    .limit(size);
    
    res.status(200).json(items);
  } catch (err) {
    res.status(404).json({ error: "Items could not be retrieved" });
  }
});

export default  router;
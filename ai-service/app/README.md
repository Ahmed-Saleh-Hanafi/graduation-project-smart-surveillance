## Structure of Folder app

```
graduation-project-smart-surveillance/ai-service/
ai-service/app
│
│   
├── main.py                  # FastAPI entry point
├── config.py                # settings (env, paths, GPU config)
│
├── api/
│   │cameras.py       # get all cameras
│   │faces.py         # add/remove embeddings
│   │control.py       # start/stop system
│   │alert.py
│
├── core/
│   │camera_worker.py 
│   │batch_queue.py
│   │batch_inference.py
│
├── data/
│   │database  
│   │face_dp.py
│   
│ 
│── models/
│      ├── face_model.py
│      ├── weapon_model.py
│      ├── abnormal_model.py
│      └── model_loader.py    # load weights on GPU/CPU
│
│── utils/
├── tests/
│   ├── test_api.py
│   ├── test_pipeline.py
│
└── README.md
```

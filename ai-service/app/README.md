## Structure of Folder app

```
graduation-project-smart-surveillance/
ai-service/app
│
│   
├── main.py                  # entry point
├── config.py                # settings (env, paths, GPU config)
│
├── comunication/
│   │alert.py 
│   │cameras.py
│   │faces.py
│
|
├── core/
│   │camera_worker.py 
│   │batch_queue.py
│   │batch_inference.py
│   |consumer.py
|
├── data/
│   │database
|         / snapshots
|         / faces.index
|         / metadata.json
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
│      ├── add_cameras.py
│      ├── add_faces.py
│      ├── draw_box_fram.py
│      └── get_provider.py
│      ├── make_snapshot.py
│      ├── normalize.py
│      ├── traker.py
│      └── validation.py
|
├── tests/
│   ├── test_pipeline.py
│
└── README.md
```

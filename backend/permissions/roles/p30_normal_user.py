from permissions.roles.p20_inactive_user import inactive_user
from slim.base.permission import Ability, A, DataRecord

normal_user = Ability('user', {
    'user': {
        'nickname': (A.QUERY, A.READ),
        'group': (A.READ,),
        'biology': (A.QUERY, A.READ, A.WRITE),
        'avatar': (A.QUERY, A.READ),
        'type': (A.QUERY, A.READ, A.WRITE),
        'url': (A.QUERY, A.READ, A.WRITE),
        'location': (A.QUERY, A.READ, A.WRITE),
        # 'key': ['query', 'read']
    },
    'topic': {
        'title': (A.READ, A.CREATE, A.WRITE),
        'board_id': (A.QUERY, A.READ, A.CREATE),
        'content': (A.READ, A.CREATE, A.WRITE),
    },
    'comment': {
        'related_id': (A.READ, A.CREATE,),
        'related_type': (A.READ, A.CREATE,),
        'reply_to_cmt_id': (A.READ, A.CREATE,),
        'state': (A.READ, A.WRITE,),
        'content': (A.READ, A.CREATE,),
    },
    'upload': {
        'id': (A.READ, A.QUERY),
        'user_id': (A.READ, A.QUERY),
        'state': (A.READ,),
        'visible': (A.READ,),
        'time': (A.READ,),
        'key': (A.READ, A.QUERY),
        'size': (A.READ, A.QUERY),
        'type_name': (A.READ, A.QUERY),
    }
}, based_on=inactive_user)
